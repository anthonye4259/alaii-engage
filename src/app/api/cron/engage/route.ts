import { NextRequest, NextResponse } from "next/server";
import { runEngagementCycle, type AgentConfig, type ConnectedAccount as AgentAccount } from "@/lib/agent";
import { DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";
import { getActiveUsers, getConnectedAccounts } from "@/lib/connected-accounts";
import { getJSON } from "@/lib/store";
import { logEngagement } from "@/lib/engagement-log";
import type { User } from "@/lib/auth";

/**
 * Multi-tenant cron — iterates all users with connected accounts.
 * Called every 10 min by Vercel cron or manually.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeEmails = await getActiveUsers();

    if (activeEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active users with connected accounts.",
        usersProcessed: 0,
      });
    }

    const results = [];

    for (const email of activeEmails) {
      try {
        const userAccounts = await getConnectedAccounts(email);
        if (userAccounts.length === 0) continue;

        // Get the user's plan — only run for paid users
        const user = await getJSON<User>(`user:${email}`);
        if (!user || user.plan === "free") continue;

        // Get user's business context (stored during onboarding)
        const bizContext = await getJSON<typeof DEFAULT_BUSINESS_CONTEXT>(`business:${email}`) || DEFAULT_BUSINESS_CONTEXT;

        // Map connected accounts to agent format
        const agentAccounts: AgentAccount[] = userAccounts.map((a) => {
          const meta: Record<string, string> = {};
          if (a.pageToken) meta.pageToken = a.pageToken;
          if (a.platformUserId) meta.igUserId = a.platformUserId;
          return {
            id: `${a.platform}_${email}`,
            platform: a.platform as AgentAccount["platform"],
            accessToken: a.accessToken,
            platformUserId: a.platformUserId || "",
            metadata: meta,
          };
        });

        const config: AgentConfig = {
          businessContext: {
            ...DEFAULT_BUSINESS_CONTEXT,
            ...bizContext,
          },
          accounts: agentAccounts,
          rules: [
            {
              id: "auto-reply",
              name: "Auto-reply to comments",
              enabled: true,
              action: "reply_own_comment",
              platforms: [...new Set(agentAccounts.map((a) => a.platform))],
              config: { replyToAll: true },
            },
            {
              id: "like-mentions",
              name: "Like mentions",
              enabled: true,
              action: "like_mention",
              platforms: [...new Set(agentAccounts.map((a) => a.platform))],
              config: {},
            },
          ],
        };

        const cycleResult = await runEngagementCycle(config);

        // Log engagements for this user's dashboard
        for (const action of cycleResult.actions) {
          await logEngagement(email, {
            platform: action.platform,
            action: action.type,
            target: action.target || "",
            detail: action.content || "",
          });
        }

        results.push({
          email,
          accounts: agentAccounts.length,
          ...cycleResult,
        });

        console.log(`✅ Cron for ${email}: ${cycleResult.engaged} engagements`);
      } catch (err) {
        console.error(`❌ Cron error for ${email}:`, err);
        results.push({ email, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      usersProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { error: "Cron failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
