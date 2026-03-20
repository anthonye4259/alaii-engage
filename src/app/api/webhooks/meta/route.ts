import { NextRequest, NextResponse } from "next/server";
import { runEngagementCycle, type AgentConfig, type ConnectedAccount as AgentAccount } from "@/lib/agent";
import { DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";
import { getActiveUsers, getConnectedAccounts } from "@/lib/connected-accounts";
import { getJSON } from "@/lib/store";
import { logEngagement } from "@/lib/engagement-log";
import type { User } from "@/lib/auth";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.CRON_SECRET || "alaii_engage_verify";

/**
 * GET — Webhook verification (Meta sends a challenge on subscription)
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[meta-webhook] ✅ Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[meta-webhook] ❌ Verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST — Receive real-time events from Meta
 *
 * Events include:
 * - Instagram comments on your posts
 * - Instagram DMs received
 * - Facebook Page comments
 * - Mentions and tags
 */
export async function POST(req: NextRequest) {
  // Verify HMAC-SHA256 signature
  const signature = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  if (signature && process.env.META_APP_SECRET) {
    const crypto = await import("crypto");
    const expected = "sha256=" + crypto
      .createHmac("sha256", process.env.META_APP_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expected) {
      console.error("[meta-webhook] ❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[meta-webhook] Received: ${payload.object}, entries: ${payload.entry?.length || 0}`);

  // Always respond 200 quickly to Meta (they retry on failure)
  // Process in background
  processWebhookEvents(payload).catch((err) =>
    console.error("[meta-webhook] Processing error:", err)
  );

  return NextResponse.json({ received: true }, { status: 200 });
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetaWebhookPayload {
  object: "instagram" | "page";
  entry: MetaWebhookEntry[];
}

interface MetaWebhookEntry {
  id: string; // Page ID or IG user ID
  time: number;
  changes?: MetaWebhookChange[];
  messaging?: MetaWebhookMessage[];
}

interface MetaWebhookChange {
  field: string;
  value: {
    item?: string;
    verb?: string;
    comment_id?: string;
    parent_id?: string;
    from?: { id: string; name?: string; username?: string };
    message?: string;
    text?: string;
    media?: { id: string; media_product_type?: string };
    post_id?: string;
    created_time?: number;
  };
}

interface MetaWebhookMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text: string };
}

// ─── Event Processing ────────────────────────────────────────────────────────

async function processWebhookEvents(payload: MetaWebhookPayload) {
  // Find the user whose account matches the incoming page/IG ID
  const activeEmails = await getActiveUsers();

  for (const entry of payload.entry || []) {
    const pageOrIgId = entry.id;

    // Find matching user by scanning connected accounts
    const match = await findUserForPlatformId(activeEmails, pageOrIgId, payload.object);
    if (!match) {
      console.log(`[meta-webhook] No user found for ${payload.object} ID: ${pageOrIgId}`);
      continue;
    }

    const { email, accounts } = match;

    // Get user info
    const user = await getJSON<User>(`user:${email}`);
    if (!user || user.plan === "free") continue;

    const bizContext = await getJSON<typeof DEFAULT_BUSINESS_CONTEXT>(`business:${email}`) || DEFAULT_BUSINESS_CONTEXT;

    // Map to agent accounts
    const agentAccounts: AgentAccount[] = accounts.map((a) => {
      const meta: Record<string, string> = {};
      if (a.pageToken) meta.pageToken = a.pageToken;
      if (a.platformUserId) meta.igUserId = a.platformUserId;
      if (a.metadata?.pageId) meta.pageId = a.metadata.pageId;
      return {
        id: `${a.platform}_${email}`,
        platform: a.platform as AgentAccount["platform"],
        accessToken: a.accessToken,
        platformUserId: a.platformUserId || "",
        metadata: meta,
      };
    });

    // Determine which rules to trigger based on event type
    const rules = buildRulesFromEvents(entry, payload.object, agentAccounts);

    if (rules.length === 0) continue;

    const config: AgentConfig = {
      userEmail: email,
      businessContext: { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext },
      accounts: agentAccounts,
      rules,
    };

    try {
      const result = await runEngagementCycle(config);

      // Log engagements
      for (const action of result.actions) {
        await logEngagement(email, {
          platform: action.platform,
          action: action.action,
          target: action.target || "",
          detail: action.content || "",
        });
      }

      console.log(`[meta-webhook] ✅ ${email}: ${result.engaged} engagements from webhook`);
    } catch (err) {
      console.error(`[meta-webhook] ❌ Error processing for ${email}:`, err);
    }
  }
}

async function findUserForPlatformId(
  emails: string[],
  platformId: string,
  objectType: string
): Promise<{ email: string; accounts: Awaited<ReturnType<typeof getConnectedAccounts>> } | null> {
  for (const email of emails) {
    const accounts = await getConnectedAccounts(email);
    const match = accounts.find((a) => {
      if (objectType === "instagram") {
        return a.platformUserId === platformId;
      }
      if (objectType === "page") {
        return a.metadata?.pageId === platformId || a.platformUserId === platformId;
      }
      return false;
    });
    if (match) return { email, accounts };
  }
  return null;
}

function buildRulesFromEvents(
  entry: MetaWebhookEntry,
  objectType: string,
  agentAccounts: AgentAccount[]
) {
  const rules: AgentConfig["rules"] = [];
  const platform = objectType === "page" ? "facebook" : "instagram";
  const platforms = [platform] as AgentAccount["platform"][];

  // Check for comment events
  const hasComments = entry.changes?.some(
    (c) => c.field === "comments" || c.field === "feed" && c.value?.item === "comment"
  );

  // Check for mention events
  const hasMentions = entry.changes?.some(
    (c) => c.field === "mentions" || c.field === "feed" && c.value?.item === "mention"
  );

  // Check for DM events
  const hasDMs = entry.messaging && entry.messaging.length > 0;

  if (hasComments) {
    rules.push({
      id: "webhook-reply",
      name: "Reply to new comment (webhook)",
      enabled: true,
      action: "reply_own_comment",
      platforms,
      config: { replyToAll: true },
    });
  }

  if (hasMentions) {
    rules.push({
      id: "webhook-mention",
      name: "Respond to mention (webhook)",
      enabled: true,
      action: "like_mention",
      platforms,
      config: {},
    });
  }

  if (hasDMs) {
    rules.push({
      id: "webhook-dm",
      name: "Reply to DM (webhook)",
      enabled: true,
      action: "reply_own_comment",
      platforms,
      config: { replyToAll: true },
    });
  }

  return rules;
}
