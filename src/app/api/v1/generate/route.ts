import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, safeUser } from "@/lib/auth";
import { generateContent, DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";
import { recordApiCall } from "@/lib/metering";

/**
 * POST /api/v1/generate — Generate AI engagement content
 *
 * Agent-friendly API endpoint.
 * Auth: Bearer token (API key from signup)
 * Cost: $0.01 per call
 *
 * Body: {
 *   platform: "instagram" | "tiktok" | "x" | "linkedin" | "reddit" | "facebook",
 *   type: "comment_reply" | "hashtag_comment" | "dm_welcome" | "dm_outreach" | "repost_caption",
 *   context: {
 *     originalContent?: string,   // The post/comment you're replying to
 *     authorName?: string,        // Who wrote it
 *     authorBio?: string,         // Their bio
 *     hashtag?: string            // Relevant hashtag
 *   },
 *   business?: {                  // Optional — uses account defaults if omitted
 *     businessName: string,
 *     industry: string,
 *     description: string,
 *     tone: string,
 *     targetAudience: string
 *   }
 * }
 *
 * Response: {
 *   content: string,        // Best variation
 *   variations: string[],   // All 3 variations
 *   confidence: number,     // 0-1 confidence score
 *   usage: { calls, cost }
 * }
 */
export async function POST(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ae_")) {
    return NextResponse.json(
      { error: "Missing or invalid API key. Use: Authorization: Bearer ae_your_key" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.replace("Bearer ", "");
  const user = await authenticateApiKey(apiKey);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Rate enforcement by plan
  const planLimits: Record<string, number> = {
    free: 100,         // 100 free calls to try the product
    pro: 10000,        // 10K calls/month
    agency: 50000,     // 50K calls/month
    developer: 999999, // Effectively unlimited
  };
  const baseLimit = planLimits[user.plan] || 100;
  const bonusCalls = user.bonusCalls || 0;
  const limit = baseLimit + bonusCalls;
  const usage = await recordApiCall(apiKey);

  if (usage.callsThisPeriod > limit) {
    return NextResponse.json({
      error: `Monthly limit of ${limit.toLocaleString()} calls exceeded. Upgrade your plan.`,
      usage: { callsThisPeriod: usage.callsThisPeriod, limit, estimatedCost: usage.estimatedCost },
      upgrade: "https://alaii-engage.vercel.app/pricing",
    }, { status: 429 });
  }

  // Parse request
  try {
    const body = await request.json();
    const { platform, type, context, business } = body;

    if (!platform || !type) {
      return NextResponse.json(
        { error: "Missing required fields: platform, type" },
        { status: 400 }
      );
    }

    const bizContext = business
      ? { ...DEFAULT_BUSINESS_CONTEXT, ...business, alwaysMention: business.alwaysMention || [], neverSay: business.neverSay || [] }
      : DEFAULT_BUSINESS_CONTEXT;

    const result = await generateContent({
      type,
      platform,
      context: context || {},
      businessContext: bizContext,
    });

    return NextResponse.json({
      content: result.content,
      variations: result.variations,
      confidence: result.confidence,
      usage: {
        callsThisPeriod: usage.callsThisPeriod,
        estimatedCost: usage.estimatedCost,
      },
      meta: {
        model: "gpt-4o-mini",
        platform,
        type,
      },
    });
  } catch (error) {
    console.error("API v1 generate error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
