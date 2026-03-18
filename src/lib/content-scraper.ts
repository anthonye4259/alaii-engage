/**
 * Content Scraper — Okara-style Reddit (and multi-platform) content discovery
 *
 * Scans target subreddits/keywords for engagement opportunities,
 * generates AI-powered comments, and queues them for review or auto-posting.
 *
 * Flow:
 *  1. Scan target subreddits for hot/new posts matching keywords
 *  2. Filter: skip already-engaged, bot accounts, low-quality posts
 *  3. Score and rank by relevance, recency, engagement potential
 *  4. Generate AI comments for top opportunities
 *  5. Store in queue for user review ("Copy + Open") or auto-post
 */

import * as redditApi from "./platforms/reddit";
import { generateContent, type BusinessContext, DEFAULT_BUSINESS_CONTEXT } from "./ai-generator";
import { analyzeSentiment } from "./sentiment";
import { hasEngaged, markEngaged } from "./dedup";
import * as store from "./store";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapeTarget {
  platform: "reddit" | "x" | "linkedin";
  subreddits?: string[];     // Reddit-specific
  keywords: string[];        // Search terms
  maxResults?: number;       // Per subreddit, default 10
}

export interface QueueItem {
  id: string;
  platform: string;
  type: "comment" | "reply" | "dm" | "post";
  status: "pending" | "approved" | "posted" | "skipped";
  // Target info
  targetId: string;          // Reddit thing_id, tweet ID, etc.
  targetUrl: string;         // Direct link to open in browser
  targetTitle?: string;      // Post title
  targetContent?: string;    // Post body (truncated)
  targetAuthor?: string;
  targetSubreddit?: string;
  targetScore?: number;      // Upvotes/likes
  targetComments?: number;
  // Generated content
  generatedComment: string;
  variations: string[];
  confidence: number;
  sentiment?: string;
  // Metadata
  relevanceScore: number;
  createdAt: number;
  expiresAt: number;       // Auto-expire stale items
}

export interface ScrapeResult {
  platform: string;
  scanned: number;
  queued: number;
  skipped: number;
  items: QueueItem[];
}

// ─── Queue Storage ───────────────────────────────────────────────────────────

const QUEUE_TTL = 48 * 3600; // 48 hours — opportunities go stale
const QUEUE_KEY_PREFIX = "queue";

function queueKey(email: string): string {
  return `${QUEUE_KEY_PREFIX}:${email}`;
}

/**
 * Get all queued items for a user
 */
export async function getQueue(email: string): Promise<QueueItem[]> {
  const raw = await store.get(queueKey(email));
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as QueueItem[];
    // Filter expired items
    const now = Date.now();
    return items.filter(i => i.expiresAt > now);
  } catch {
    return [];
  }
}

/**
 * Save queue items (merges with existing)
 */
async function saveQueue(email: string, newItems: QueueItem[]): Promise<void> {
  const existing = await getQueue(email);
  // Deduplicate by targetId
  const existingIds = new Set(existing.map(i => i.targetId));
  const merged = [...existing, ...newItems.filter(i => !existingIds.has(i.targetId))];
  // Cap at 50 items
  const capped = merged.slice(-50);
  await store.set(queueKey(email), JSON.stringify(capped), QUEUE_TTL);
}

/**
 * Update a queue item's status
 */
export async function updateQueueItem(
  email: string,
  itemId: string,
  status: QueueItem["status"]
): Promise<void> {
  const items = await getQueue(email);
  const idx = items.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    items[idx].status = status;
    await store.set(queueKey(email), JSON.stringify(items), QUEUE_TTL);
  }
}

// ─── Reddit Scraper ──────────────────────────────────────────────────────────

/**
 * Scan Reddit for engagement opportunities
 */
export async function scrapeReddit(
  accessToken: string,
  username: string,
  target: ScrapeTarget,
  businessContext: BusinessContext,
  accountId: string
): Promise<ScrapeResult> {
  const opts = { accessToken, username };
  const result: ScrapeResult = { platform: "reddit", scanned: 0, queued: 0, skipped: 0, items: [] };
  const maxPerSub = target.maxResults || 10;

  for (const subreddit of target.subreddits || []) {
    try {
      // Get hot posts from the subreddit
      const posts = await redditApi.getSubredditPosts(subreddit, opts, "hot", maxPerSub);

      for (const post of posts?.data?.children || []) {
        result.scanned++;
        const p = post.data;

        // Skip: already engaged
        if (await hasEngaged("reddit", accountId, p.name)) {
          result.skipped++;
          continue;
        }

        // Skip: our own posts
        if (p.author === username) {
          result.skipped++;
          continue;
        }

        // Skip: locked, removed, or NSFW
        if (p.locked || p.removed_by_category || p.over_18) {
          result.skipped++;
          continue;
        }

        // Skip: too old (>24 hours)
        const ageHours = (Date.now() / 1000 - p.created_utc) / 3600;
        if (ageHours > 24) {
          result.skipped++;
          continue;
        }

        // Relevance check — does it match our keywords?
        const postText = `${p.title} ${p.selftext || ""}`.toLowerCase();
        const keywordMatches = target.keywords.filter(kw => postText.includes(kw.toLowerCase()));
        if (keywordMatches.length === 0 && target.keywords.length > 0) {
          result.skipped++; // Not relevant
          continue;
        }

        // Score the opportunity
        let relevanceScore = 50;
        relevanceScore += Math.min(keywordMatches.length * 10, 30); // Keyword matches
        relevanceScore += Math.min(Math.log10(Math.max(p.score, 1)) * 5, 15); // Post upvotes
        relevanceScore += Math.min(Math.log10(Math.max(p.num_comments || 1, 1)) * 5, 10); // Activity
        if (ageHours < 2) relevanceScore += 15; // Very fresh
        else if (ageHours < 6) relevanceScore += 8;
        relevanceScore = Math.min(100, relevanceScore);

        // Analyze sentiment of the post
        const sentiment = analyzeSentiment(p.title + " " + (p.selftext || ""));

        // Generate AI comment
        const generated = await generateContent({
          type: "hashtag_comment",
          platform: "reddit",
          context: {
            originalContent: p.title + (p.selftext ? `\n\n${p.selftext.slice(0, 500)}` : ""),
            authorName: p.author,
            hashtag: subreddit,
            sentimentGuidance: sentiment.responseGuidance,
          },
          businessContext,
        });

        const queueItem: QueueItem = {
          id: `reddit_${p.name}_${Date.now()}`,
          platform: "reddit",
          type: "comment",
          status: "pending",
          targetId: p.name,
          targetUrl: `https://reddit.com${p.permalink}`,
          targetTitle: p.title,
          targetContent: (p.selftext || "").slice(0, 300),
          targetAuthor: p.author,
          targetSubreddit: subreddit,
          targetScore: p.score,
          targetComments: p.num_comments,
          generatedComment: generated.content,
          variations: generated.variations,
          confidence: generated.confidence,
          sentiment: sentiment.sentiment,
          relevanceScore,
          createdAt: Date.now(),
          expiresAt: Date.now() + QUEUE_TTL * 1000,
        };

        result.items.push(queueItem);
        result.queued++;

        // Rate limit — don't hit Reddit API too fast
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      }
    } catch (err) {
      console.error(`[scraper] Error scanning r/${subreddit}:`, err);
    }
  }

  // Also search by keywords across all of Reddit
  for (const keyword of target.keywords) {
    try {
      const searchResults = await redditApi.search(keyword, opts, undefined, 5);

      for (const post of searchResults?.data?.children || []) {
        result.scanned++;
        const p = post.data;

        if (await hasEngaged("reddit", accountId, p.name)) { result.skipped++; continue; }
        if (p.author === username) { result.skipped++; continue; }
        if (p.locked || p.over_18) { result.skipped++; continue; }

        const ageHours = (Date.now() / 1000 - p.created_utc) / 3600;
        if (ageHours > 24) { result.skipped++; continue; }

        const sentiment = analyzeSentiment(p.title + " " + (p.selftext || ""));

        const generated = await generateContent({
          type: "hashtag_comment",
          platform: "reddit",
          context: {
            originalContent: p.title + (p.selftext ? `\n\n${p.selftext.slice(0, 500)}` : ""),
            authorName: p.author,
            hashtag: keyword,
            sentimentGuidance: sentiment.responseGuidance,
          },
          businessContext,
        });

        result.items.push({
          id: `reddit_${p.name}_${Date.now()}`,
          platform: "reddit",
          type: "comment",
          status: "pending",
          targetId: p.name,
          targetUrl: `https://reddit.com${p.permalink}`,
          targetTitle: p.title,
          targetContent: (p.selftext || "").slice(0, 300),
          targetAuthor: p.author,
          targetSubreddit: p.subreddit,
          targetScore: p.score,
          targetComments: p.num_comments,
          generatedComment: generated.content,
          variations: generated.variations,
          confidence: generated.confidence,
          sentiment: sentiment.sentiment,
          relevanceScore: 60, // Keyword search = moderate relevance
          createdAt: Date.now(),
          expiresAt: Date.now() + QUEUE_TTL * 1000,
        });
        result.queued++;

        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      }
    } catch (err) {
      console.error(`[scraper] Error searching "${keyword}":`, err);
    }
  }

  // Sort by relevance
  result.items.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return result;
}

/**
 * Auto-post approved queue items
 */
export async function postApprovedItems(
  email: string,
  accessToken: string,
  username: string
): Promise<{ posted: number; errors: string[] }> {
  const items = await getQueue(email);
  const approved = items.filter(i => i.status === "approved");
  const results = { posted: 0, errors: [] as string[] };

  for (const item of approved) {
    try {
      if (item.platform === "reddit") {
        const opts = { accessToken, username };
        const res = await redditApi.reply(item.targetId, item.generatedComment, opts);
        if (res.success) {
          item.status = "posted";
          await markEngaged("reddit", `reddit_${email}`, item.targetId);
          results.posted++;
        } else {
          results.errors.push(`Failed to post to ${item.targetId}: ${res.status}`);
        }
      }
      // Human-like delay between posts
      await new Promise(r => setTimeout(r, 5000 + Math.random() * 10000));
    } catch (err) {
      results.errors.push(`Error posting ${item.id}: ${err}`);
    }
  }

  // Save updated statuses
  await store.set(queueKey(email), JSON.stringify(items), QUEUE_TTL);

  return results;
}
