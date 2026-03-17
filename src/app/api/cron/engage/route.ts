import { NextRequest, NextResponse } from "next/server";
import { runEngagementCycle, type AgentConfig, type ConnectedAccount } from "@/lib/agent";
import { DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";

// Cron endpoint - triggers one engagement cycle
// Set up via vercel.json cron schedule (every 10 min)
// Or call manually: POST /api/cron/engage
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Load connected accounts from env vars
    // Format: ACCOUNT_<PLATFORM>=<accessToken>:<platformUserId>:<metadata>
    const accounts = loadAccountsFromEnv();

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No accounts configured. Set ACCOUNT_INSTAGRAM, ACCOUNT_TIKTOK, etc. env vars.",
        scanned: 0,
        engaged: 0,
        skipped: 0,
        errors: [],
        actions: [],
      });
    }

    const config: AgentConfig = {
      businessContext: {
        ...DEFAULT_BUSINESS_CONTEXT,
        businessName: process.env.BUSINESS_NAME || "My Business",
        description: process.env.BUSINESS_DESCRIPTION || "",
        tone: process.env.BUSINESS_TONE || "professional but friendly",
        targetAudience: process.env.TARGET_AUDIENCE || "",
        industry: process.env.BUSINESS_INDUSTRY || "",
        alwaysMention: process.env.ALWAYS_MENTION?.split(",").map((s) => s.trim()).filter(Boolean) || [],
        neverSay: process.env.NEVER_SAY?.split(",").map((s) => s.trim()).filter(Boolean) || [],
        additionalContext: process.env.BUSINESS_ADDITIONAL_CONTEXT || "",
      },
      accounts,
      rules: [
        {
          id: "auto-reply",
          name: "Auto-reply to comments",
          enabled: true,
          action: "reply_own_comment",
          platforms: getEnabledPlatforms(accounts),
          config: { replyToAll: true },
        },
        {
          id: "like-mentions",
          name: "Like mentions",
          enabled: true,
          action: "like_mention",
          platforms: getEnabledPlatforms(accounts),
          config: {},
        },
        {
          id: "hashtag-engage",
          name: "Comment on hashtags",
          enabled: process.env.HASHTAG_ENGAGE_ENABLED === "true",
          action: "comment_hashtag",
          platforms: getEnabledPlatforms(accounts),
          config: {
            hashtags: process.env.TARGET_HASHTAGS?.split(",").map((s) => s.trim()).filter(Boolean) || [],
          },
        },
      ],
    };

    const results = await runEngagementCycle(config);

    console.log("Engagement cycle complete:", {
      accounts: accounts.length,
      scanned: results.scanned,
      engaged: results.engaged,
      skipped: results.skipped,
      errors: results.errors.length,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      accountsConfigured: accounts.length,
      ...results,
    });
  } catch (error) {
    console.error("Engagement cycle error:", error);
    return NextResponse.json(
      { error: "Engagement cycle failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Also handle GET for Vercel Cron
export async function GET(req: NextRequest) {
  return POST(req);
}

/**
 * Load connected accounts from environment variables
 * Format: ACCOUNT_INSTAGRAM=accessToken:platformUserId:pageId:pageToken
 */
function loadAccountsFromEnv(): ConnectedAccount[] {
  const accounts: ConnectedAccount[] = [];
  const platformMap: Record<string, string> = {
    ACCOUNT_INSTAGRAM: "instagram",
    ACCOUNT_TIKTOK: "tiktok",
    ACCOUNT_FACEBOOK: "facebook",
    ACCOUNT_X: "x",
    ACCOUNT_REDDIT: "reddit",
    ACCOUNT_LINKEDIN: "linkedin",
  };

  for (const [envKey, platform] of Object.entries(platformMap)) {
    const value = process.env[envKey];
    if (!value) continue;

    const parts = value.split(":");
    const accessToken = parts[0];
    const platformUserId = parts[1] || "";
    const metadata: Record<string, string> = {};

    // Platform-specific metadata
    if (platform === "facebook" || platform === "instagram") {
      if (parts[2]) metadata.pageId = parts[2];
      if (parts[3]) metadata.pageToken = parts[3];
      if (platform === "instagram") metadata.igUserId = platformUserId;
    }
    if (platform === "x") {
      metadata.userId = platformUserId;
    }
    if (platform === "linkedin") {
      if (parts[2]) metadata.personUrn = parts[2];
    }

    accounts.push({
      id: `${platform}_account`,
      platform: platform as ConnectedAccount["platform"],
      accessToken,
      platformUserId,
      metadata,
    });
  }

  return accounts;
}

/**
 * Get the list of platforms that have connected accounts
 */
function getEnabledPlatforms(accounts: ConnectedAccount[]): ConnectedAccount["platform"][] {
  return [...new Set(accounts.map((a) => a.platform))];
}
