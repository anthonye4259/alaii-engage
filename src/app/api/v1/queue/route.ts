import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey } from "@/lib/auth";
import { getConnectedAccounts } from "@/lib/connected-accounts";
import { getJSON, set, get } from "@/lib/store";
import { DEFAULT_BUSINESS_CONTEXT } from "@/lib/ai-generator";
import {
  scrapeReddit,
  getQueue,
  updateQueueItem,
  postApprovedItems,
  type ScrapeTarget,
} from "@/lib/content-scraper";

/**
 * Authenticate via session cookie or API key
 */
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

  const items = await getQueue(user.email);
  return NextResponse.json({ items, count: items.length });
}

/**
 * POST /api/v1/queue — Scrape and generate new queue items
 */
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { platforms = ["reddit"], subreddits = [], keywords = [] } = body;

  if (subreddits.length === 0 && keywords.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one subreddit or keyword" },
      { status: 400 }
    );
  }

  const bizContext = await getJSON<typeof DEFAULT_BUSINESS_CONTEXT>(`business:${user.email}`) || DEFAULT_BUSINESS_CONTEXT;
  const accounts = await getConnectedAccounts(user.email);
  const results = [];

  if (platforms.includes("reddit")) {
    const redditAccount = accounts.find(a => a.platform === "reddit");
    if (redditAccount) {
      const target: ScrapeTarget = {
        platform: "reddit",
        subreddits,
        keywords,
        maxResults: 10,
      };

      const scrapeResult = await scrapeReddit(
        redditAccount.accessToken,
        redditAccount.platformUserId || "",
        target,
        { ...DEFAULT_BUSINESS_CONTEXT, ...bizContext },
        `reddit_${user.email}`
      );

      // Save to queue
      const existingRaw = await get(`queue:${user.email}`);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const existingIds = new Set(existing.map((i: { targetId: string }) => i.targetId));
      const newItems = scrapeResult.items.filter(i => !existingIds.has(i.targetId));
      const merged = [...existing, ...newItems].slice(-50);
      await set(`queue:${user.email}`, JSON.stringify(merged), 48 * 3600);

      results.push(scrapeResult);
    } else {
      results.push({ platform: "reddit", error: "No Reddit account connected" });
    }
  }

  return NextResponse.json({
    success: true,
    results,
    totalQueued: results.reduce((sum, r) => sum + ("queued" in r ? (r as { queued: number }).queued : 0), 0),
  });
}

/**
 * PATCH /api/v1/queue — Update a queue item (approve, skip, post)
 */
export async function PATCH(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { itemId, action } = body;

  if (action === "post_all") {
    const accounts = await getConnectedAccounts(user.email);
    const redditAccount = accounts.find(a => a.platform === "reddit");
    if (!redditAccount) {
      return NextResponse.json({ error: "No Reddit account connected" }, { status: 400 });
    }

    const result = await postApprovedItems(
      user.email,
      redditAccount.accessToken,
      redditAccount.platformUserId || ""
    );

    return NextResponse.json({ success: true, ...result });
  }

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" as const : "skipped" as const;
  await updateQueueItem(user.email, itemId, status);

  return NextResponse.json({ success: true, itemId, status });
}
