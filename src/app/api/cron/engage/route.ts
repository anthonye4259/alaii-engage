import { NextRequest, NextResponse } from "next/server";
import { runEngagementCycle, type AgentConfig } from "@/lib/agent";
import { DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";

// Cron endpoint - triggers one engagement cycle
// Set up via vercel.json cron schedule (every 10 min)
// Or call manually: POST /api/cron/engage
export async function POST(req: NextRequest) {
  // Verify cron secret (prevent unauthorized triggers)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Load from database in production
    const config: AgentConfig = {
      businessContext: {
        ...DEFAULT_BUSINESS_CONTEXT,
        // These would come from the user's Chat page context stored in DB
        businessName: process.env.BUSINESS_NAME || "My Business",
        description: process.env.BUSINESS_DESCRIPTION || "",
        tone: process.env.BUSINESS_TONE || "professional but friendly",
        targetAudience: process.env.TARGET_AUDIENCE || "",
        industry: process.env.BUSINESS_INDUSTRY || "",
        alwaysMention: process.env.ALWAYS_MENTION?.split(",") || [],
        neverSay: process.env.NEVER_SAY?.split(",") || [],
        additionalContext: "",
      },
      accounts: [],  // TODO: Load connected accounts from database
      rules: [
        {
          id: "auto-reply",
          name: "Auto-reply to comments",
          enabled: true,
          action: "reply_own_comment",
          platforms: ["instagram", "linkedin", "facebook", "tiktok"],
          config: { replyToAll: true },
        },
        {
          id: "like-mentions",
          name: "Like mentions",
          enabled: true,
          action: "like_mention",
          platforms: ["instagram", "linkedin", "x"],
          config: {},
        },
        {
          id: "hashtag-engage",
          name: "Comment on hashtags",
          enabled: false,
          action: "comment_hashtag",
          platforms: ["instagram", "tiktok"],
          config: { hashtags: ["smallbusiness", "barber", "barbershop"] },
        },
      ],
    };

    const results = await runEngagementCycle(config);

    console.log("🤖 Engagement cycle complete:", {
      scanned: results.scanned,
      engaged: results.engaged,
      skipped: results.skipped,
      errors: results.errors.length,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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
