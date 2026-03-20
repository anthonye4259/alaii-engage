import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey } from "@/lib/auth";
import { getConnectedAccounts } from "@/lib/connected-accounts";
import { getJSON, set, get } from "@/lib/store";
import { DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";
import {
  scrapeReddit, scrapeX, scrapeInstagram, scrapeFacebook, scrapeLinkedIn, scrapeTikTok,
  getQueue, updateQueueItem, postApprovedItems, saveQueue,
  type ScrapeTarget, type ScrapeResult,
} from "@/lib/content-scraper";

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    return authenticateApiKey(authHeader.replace("Bearer ", ""));
  }
  return getCurrentUser();
}

/**
 * GET /api/v1/queue — Get queued engagement items
 */
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  const items = await getQueue(user.email);
  return NextResponse.json({ items, count: items.length });
}

/**
 * POST /api/v1/queue — Scrape and generate new queue items
 *
 * Body: {
 *   platforms: ["reddit", "x", "instagram", "facebook", "linkedin", "tiktok"],
 *   subreddits: ["SaaS", "marketing"],
 *   hashtags: ["socialmedia", "AImarketing"],
 *   keywords: ["social media automation", "AI engagement"]
 * }
 */
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  const body = await req.json();
  const {
    platforms = ["reddit"],
    subreddits = [],
    hashtags = [],
    keywords = [],
  } = body;

  if (subreddits.length === 0 && keywords.length === 0 && hashtags.length === 0) {
    return NextResponse.json({ error: "Provide at least one subreddit, hashtag, or keyword" }, { status: 400 });
  }

  const bizContext = await getJSON<typeof DEFAULT_BUSINESS_CONTEXT>(`business:${user.email}`) || DEFAULT_BUSINESS_CONTEXT;
  const accounts = await getConnectedAccounts(user.email);
  const results: ScrapeResult[] = [];

  // Reddit
  if (platforms.includes("reddit")) {
    const acct = accounts.find(a => a.platform === "reddit");
    if (acct) {
      const r = await scrapeReddit(
        acct.accessToken, acct.platformUserId || "", { platform: "reddit", subreddits, keywords },
        { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext }, `reddit_${user.email}`
      );
      results.push(r);
    } else {
      results.push({ platform: "reddit", scanned: 0, queued: 0, skipped: 0, items: [] });
    }
  }

  // X/Twitter
  if (platforms.includes("x")) {
    const acct = accounts.find(a => a.platform === "x");
    if (acct) {
      const r = await scrapeX(
        acct.accessToken, acct.platformUserId || "", { platform: "x", keywords },
        { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext }, `x_${user.email}`
      );
      results.push(r);
    } else {
      results.push({ platform: "x", scanned: 0, queued: 0, skipped: 0, items: [] });
    }
  }

  // Instagram
  if (platforms.includes("instagram")) {
    const acct = accounts.find(a => a.platform === "instagram");
    if (acct) {
      const r = await scrapeInstagram(
        acct.accessToken, acct.platformUserId || "", { platform: "instagram", hashtags, keywords },
        { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext }, `ig_${user.email}`
      );
      results.push(r);
    } else {
      results.push({ platform: "instagram", scanned: 0, queued: 0, skipped: 0, items: [] });
    }
  }

  // Facebook
  if (platforms.includes("facebook")) {
    const acct = accounts.find(a => a.platform === "facebook");
    if (acct) {
      const r = await scrapeFacebook(
        acct.accessToken, acct.platformUserId || "", { platform: "facebook", keywords },
        { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext }, `fb_${user.email}`
      );
      results.push(r);
    } else {
      results.push({ platform: "facebook", scanned: 0, queued: 0, skipped: 0, items: [] });
    }
  }

  // LinkedIn
  if (platforms.includes("linkedin")) {
    const acct = accounts.find(a => a.platform === "linkedin");
    const r = await scrapeLinkedIn(
      acct?.accessToken || "", acct?.platformUserId || "", { platform: "linkedin", keywords },
      { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext }, `li_${user.email}`
    );
    results.push(r);
  }

  // TikTok
  if (platforms.includes("tiktok")) {
    const acct = accounts.find(a => a.platform === "tiktok");
    if (acct) {
      const r = await scrapeTikTok(
        acct.accessToken, acct.platformUserId || "", { platform: "tiktok", keywords },
        { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext }, `tt_${user.email}`
      );
      results.push(r);
    } else {
      results.push({ platform: "tiktok", scanned: 0, queued: 0, skipped: 0, items: [] });
    }
  }

  // Save all items to queue
  const allItems = results.flatMap(r => r.items);
  if (allItems.length > 0) {
    await saveQueue(user.email, allItems);
  }

  return NextResponse.json({
    success: true,
    results: results.map(r => ({ platform: r.platform, scanned: r.scanned, queued: r.queued, skipped: r.skipped })),
    totalQueued: allItems.length,
  });
}

/**
 * PATCH /api/v1/queue — Update a queue item (approve, skip, post)
 */
export async function PATCH(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  const body = await req.json();
  const { itemId, action } = body;

  if (action === "post_all") {
    const accounts = await getConnectedAccounts(user.email);
    const reddit = accounts.find(a => a.platform === "reddit");
    const x = accounts.find(a => a.platform === "x");
    const ig = accounts.find(a => a.platform === "instagram");
    const fb = accounts.find(a => a.platform === "facebook");

    const result = await postApprovedItems(user.email, {
      reddit: reddit ? { accessToken: reddit.accessToken, username: reddit.platformUserId || "" } : undefined,
      x: x ? { accessToken: x.accessToken, userId: x.platformUserId || "" } : undefined,
      instagram: ig ? { accessToken: ig.accessToken, igUserId: ig.platformUserId || "" } : undefined,
      facebook: fb ? { pageAccessToken: fb.accessToken, pageId: fb.platformUserId || "" } : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  }

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" as const : "skipped" as const;
  await updateQueueItem(user.email, itemId, status);
  return NextResponse.json({ success: true, itemId, status });
}
