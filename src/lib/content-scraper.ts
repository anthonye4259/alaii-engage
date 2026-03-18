/**
 * Content Scraper — Multi-platform content discovery + AI comment generation
 *
 * Scans Reddit, X/Twitter, Instagram, Facebook, LinkedIn, and TikTok
 * for engagement opportunities, generates AI comments, and queues for review.
 *
 * Flow:
 *  1. Scan target platforms for posts matching keywords/hashtags
 *  2. Filter: already-engaged, bots, locked, stale, low-quality
 *  3. Score and rank by relevance, recency, engagement potential
 *  4. Generate AI comments for top opportunities
 *  5. Queue for user review ("Copy + Open") or auto-post
 */

import * as redditApi from "./platforms/reddit";
import * as xApi from "./platforms/x";
import * as instagramApi from "./platforms/instagram";
import * as facebookApi from "./platforms/facebook";
import * as tiktokApi from "./platforms/tiktok";
import { generateContent, type BusinessContext, DEFAULT_BUSINESS_CONTEXT } from "./ai-generator";
import { analyzeSentiment } from "./sentiment";
import { hasEngaged, markEngaged } from "./dedup";
import * as store from "./store";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapeTarget {
  platform: "reddit" | "x" | "instagram" | "facebook" | "linkedin" | "tiktok";
  subreddits?: string[];     // Reddit-specific
  hashtags?: string[];       // Instagram, TikTok
  keywords: string[];        // Universal search terms
  maxResults?: number;
}

export interface QueueItem {
  id: string;
  platform: string;
  type: "comment" | "reply" | "dm" | "post";
  status: "pending" | "approved" | "posted" | "skipped";
  targetId: string;
  targetUrl: string;
  targetTitle?: string;
  targetContent?: string;
  targetAuthor?: string;
  targetSubreddit?: string;
  targetScore?: number;
  targetComments?: number;
  generatedComment: string;
  variations: string[];
  confidence: number;
  sentiment?: string;
  relevanceScore: number;
  createdAt: number;
  expiresAt: number;
}

export interface ScrapeResult {
  platform: string;
  scanned: number;
  queued: number;
  skipped: number;
  items: QueueItem[];
}

// ─── Queue Storage ───────────────────────────────────────────────────────────

const QUEUE_TTL = 48 * 3600;
const QUEUE_KEY_PREFIX = "queue";

function queueKey(email: string): string {
  return `${QUEUE_KEY_PREFIX}:${email}`;
}

export async function getQueue(email: string): Promise<QueueItem[]> {
  const raw = await store.get(queueKey(email));
  if (!raw) return [];
  try {
    const items = JSON.parse(raw) as QueueItem[];
    return items.filter(i => i.expiresAt > Date.now());
  } catch { return []; }
}

export async function saveQueue(email: string, newItems: QueueItem[]): Promise<void> {
  const existing = await getQueue(email);
  const existingIds = new Set(existing.map(i => i.targetId));
  const merged = [...existing, ...newItems.filter(i => !existingIds.has(i.targetId))].slice(-100);
  await store.set(queueKey(email), JSON.stringify(merged), QUEUE_TTL);
}

export async function updateQueueItem(email: string, itemId: string, status: QueueItem["status"]): Promise<void> {
  const items = await getQueue(email);
  const idx = items.findIndex(i => i.id === itemId);
  if (idx >= 0) {
    items[idx].status = status;
    await store.set(queueKey(email), JSON.stringify(items), QUEUE_TTL);
  }
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function scoreByKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  const matches = keywords.filter(kw => lower.includes(kw.toLowerCase()));
  return Math.min(matches.length * 10, 30);
}

async function generateComment(
  platform: string, content: string, author: string,
  hashtag: string, biz: BusinessContext
) {
  const sentiment = analyzeSentiment(content);
  const generated = await generateContent({
    type: "hashtag_comment",
    platform,
    context: {
      originalContent: content.slice(0, 500),
      authorName: author,
      hashtag,
      sentimentGuidance: sentiment.responseGuidance,
    },
    businessContext: biz,
  });
  return { generated, sentiment };
}

function makeQueueItem(
  platform: string, id: string, url: string, title: string,
  content: string, author: string, score: number, comments: number,
  generated: { content: string; variations: string[]; confidence: number },
  sentiment: string, relevance: number, sub?: string
): QueueItem {
  return {
    id: `${platform}_${id}_${Date.now()}`,
    platform, type: "comment", status: "pending",
    targetId: id, targetUrl: url, targetTitle: title,
    targetContent: content.slice(0, 300), targetAuthor: author,
    targetSubreddit: sub, targetScore: score, targetComments: comments,
    generatedComment: generated.content, variations: generated.variations,
    confidence: generated.confidence, sentiment,
    relevanceScore: Math.min(100, relevance),
    createdAt: Date.now(), expiresAt: Date.now() + QUEUE_TTL * 1000,
  };
}

// ─── Reddit Scraper ──────────────────────────────────────────────────────────

export async function scrapeReddit(
  accessToken: string, username: string, target: ScrapeTarget,
  biz: BusinessContext, accountId: string
): Promise<ScrapeResult> {
  const opts = { accessToken, username };
  const result: ScrapeResult = { platform: "reddit", scanned: 0, queued: 0, skipped: 0, items: [] };
  const max = target.maxResults || 10;

  for (const sub of target.subreddits || []) {
    try {
      const posts = await redditApi.getSubredditPosts(sub, opts, "hot", max);
      for (const post of posts?.data?.children || []) {
        result.scanned++;
        const p = post.data;
        if (await hasEngaged("reddit", accountId, p.name)) { result.skipped++; continue; }
        if (p.author === username || p.locked || p.removed_by_category || p.over_18) { result.skipped++; continue; }
        const age = (Date.now() / 1000 - p.created_utc) / 3600;
        if (age > 24) { result.skipped++; continue; }
        const text = `${p.title} ${p.selftext || ""}`;
        const kwScore = scoreByKeywords(text, target.keywords);
        if (kwScore === 0 && target.keywords.length > 0) { result.skipped++; continue; }
        let rel = 50 + kwScore + Math.min(Math.log10(Math.max(p.score, 1)) * 5, 15);
        if (age < 2) rel += 15; else if (age < 6) rel += 8;
        const { generated, sentiment } = await generateComment("reddit", text, p.author, sub, biz);
        result.items.push(makeQueueItem("reddit", p.name, `https://reddit.com${p.permalink}`, p.title, p.selftext || "", p.author, p.score, p.num_comments, generated, sentiment.sentiment, rel, sub));
        result.queued++;
        await delay(1000 + Math.random() * 2000);
      }
    } catch (err) { console.error(`[scraper] r/${sub}:`, err); }
  }
  for (const kw of target.keywords) {
    try {
      const res = await redditApi.search(kw, opts, undefined, 5);
      for (const post of res?.data?.children || []) {
        result.scanned++;
        const p = post.data;
        if (await hasEngaged("reddit", accountId, p.name)) { result.skipped++; continue; }
        if (p.author === username || p.locked || p.over_18) { result.skipped++; continue; }
        if ((Date.now() / 1000 - p.created_utc) / 3600 > 24) { result.skipped++; continue; }
        const { generated, sentiment } = await generateComment("reddit", `${p.title} ${p.selftext || ""}`, p.author, kw, biz);
        result.items.push(makeQueueItem("reddit", p.name, `https://reddit.com${p.permalink}`, p.title, p.selftext || "", p.author, p.score, p.num_comments, generated, sentiment.sentiment, 60, p.subreddit));
        result.queued++;
        await delay(1000 + Math.random() * 2000);
      }
    } catch (err) { console.error(`[scraper] search "${kw}":`, err); }
  }
  result.items.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return result;
}

// ─── X/Twitter Scraper ───────────────────────────────────────────────────────

export async function scrapeX(
  accessToken: string, userId: string, target: ScrapeTarget,
  biz: BusinessContext, accountId: string
): Promise<ScrapeResult> {
  const opts = { accessToken, userId };
  const result: ScrapeResult = { platform: "x", scanned: 0, queued: 0, skipped: 0, items: [] };

  for (const kw of target.keywords) {
    try {
      const tweets = await xApi.searchTweets(kw, opts, target.maxResults || 10);
      for (const t of tweets?.data || []) {
        result.scanned++;
        if (await hasEngaged("x", accountId, t.id)) { result.skipped++; continue; }
        if (t.author_id === userId) { result.skipped++; continue; }
        const metrics = t.public_metrics || {};
        const kwScore = scoreByKeywords(t.text, target.keywords);
        let rel = 50 + kwScore;
        rel += Math.min(Math.log10(Math.max(metrics.like_count || 1, 1)) * 5, 15);
        rel += Math.min(Math.log10(Math.max(metrics.reply_count || 1, 1)) * 5, 10);
        const { generated, sentiment } = await generateComment("x", t.text, t.author_id || "", kw, biz);
        result.items.push(makeQueueItem("x", t.id, `https://x.com/i/status/${t.id}`, t.text.slice(0, 100), t.text, t.author_id || "", metrics.like_count || 0, metrics.reply_count || 0, generated, sentiment.sentiment, rel));
        result.queued++;
        await delay(1000 + Math.random() * 2000);
      }
    } catch (err) { console.error(`[scraper] X search "${kw}":`, err); }
  }
  result.items.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return result;
}

// ─── Instagram Scraper ───────────────────────────────────────────────────────

export async function scrapeInstagram(
  accessToken: string, igUserId: string, target: ScrapeTarget,
  biz: BusinessContext, accountId: string
): Promise<ScrapeResult> {
  const opts = { accessToken, igUserId };
  const result: ScrapeResult = { platform: "instagram", scanned: 0, queued: 0, skipped: 0, items: [] };

  for (const hashtag of target.hashtags || target.keywords) {
    try {
      const posts = await instagramApi.searchHashtag(hashtag, opts);
      for (const p of posts?.data || []) {
        result.scanned++;
        if (await hasEngaged("instagram", accountId, p.id)) { result.skipped++; continue; }
        const kwScore = scoreByKeywords(p.caption || "", target.keywords);
        let rel = 50 + kwScore + 10; // Hashtag match = inherent relevance
        const { generated, sentiment } = await generateComment("instagram", p.caption || "(photo post)", p.username || "", hashtag, biz);
        result.items.push(makeQueueItem("instagram", p.id, p.permalink || `https://instagram.com/p/${p.id}`, (p.caption || "").slice(0, 100), p.caption || "", p.username || "", 0, 0, generated, sentiment.sentiment, rel));
        result.queued++;
        await delay(1500 + Math.random() * 2000);
      }
    } catch (err) { console.error(`[scraper] IG #${hashtag}:`, err); }
  }
  result.items.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return result;
}

// ─── Facebook Scraper ────────────────────────────────────────────────────────

export async function scrapeFacebook(
  pageAccessToken: string, pageId: string, target: ScrapeTarget,
  biz: BusinessContext, accountId: string
): Promise<ScrapeResult> {
  const opts = { pageAccessToken, pageId };
  const result: ScrapeResult = { platform: "facebook", scanned: 0, queued: 0, skipped: 0, items: [] };

  try {
    // Scan own page posts for unanswered comments
    const posts = await facebookApi.getPagePosts(opts, target.maxResults || 10);
    for (const post of posts?.data || []) {
      const comments = await facebookApi.getComments(post.id, opts);
      for (const c of comments?.data || []) {
        result.scanned++;
        if (await hasEngaged("facebook", accountId, c.id)) { result.skipped++; continue; }
        const kwScore = scoreByKeywords(c.message || "", target.keywords);
        let rel = 55 + kwScore;
        const sentiment = analyzeSentiment(c.message || "");
        if (sentiment.sentiment === "question") rel += 15;
        if (sentiment.sentiment === "complaint") rel += 20;
        const { generated } = await generateComment("facebook", c.message || "", c.from?.name || "", "page", biz);
        result.items.push(makeQueueItem("facebook", c.id, `https://facebook.com/${post.id}`, (c.message || "").slice(0, 100), c.message || "", c.from?.name || "", 0, 0, generated, sentiment.sentiment, rel));
        result.queued++;
        await delay(1000 + Math.random() * 1500);
      }
    }
  } catch (err) { console.error("[scraper] FB:", err); }

  result.items.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return result;
}

// ─── LinkedIn Scraper ────────────────────────────────────────────────────────

export async function scrapeLinkedIn(
  accessToken: string, personUrn: string, target: ScrapeTarget,
  biz: BusinessContext, accountId: string
): Promise<ScrapeResult> {
  const result: ScrapeResult = { platform: "linkedin", scanned: 0, queued: 0, skipped: 0, items: [] };

  // LinkedIn doesn't have a public search API for third-party apps
  // But we can generate comments for LinkedIn using keyword context
  // The user copies the comment and pastes it on linkedin.com
  for (const kw of target.keywords) {
    try {
      result.scanned++;
      const { generated, sentiment } = await generateComment(
        "linkedin",
        `A LinkedIn post about: ${kw}. This is a professional discussion in the ${biz.industry} space.`,
        "professional", kw, biz
      );
      result.items.push(makeQueueItem(
        "linkedin", `li_${kw}_${Date.now()}`,
        `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(kw)}`,
        `LinkedIn: "${kw}" discussions`,
        `Search LinkedIn for "${kw}" and use the generated comment`,
        "", 0, 0, generated, sentiment.sentiment, 50
      ));
      result.queued++;
    } catch (err) { console.error(`[scraper] LinkedIn "${kw}":`, err); }
  }
  return result;
}

// ─── TikTok Scraper ──────────────────────────────────────────────────────────

export async function scrapeTikTok(
  accessToken: string, openId: string, target: ScrapeTarget,
  biz: BusinessContext, accountId: string
): Promise<ScrapeResult> {
  const opts = { accessToken, openId };
  const result: ScrapeResult = { platform: "tiktok", scanned: 0, queued: 0, skipped: 0, items: [] };

  for (const kw of target.keywords) {
    try {
      const videos = await tiktokApi.searchVideos(kw, opts, target.maxResults || 5);
      for (const v of videos?.data?.videos || []) {
        result.scanned++;
        if (await hasEngaged("tiktok", accountId, v.id)) { result.skipped++; continue; }
        const kwScore = scoreByKeywords(v.title || "", target.keywords);
        let rel = 50 + kwScore + 10;
        const { generated, sentiment } = await generateComment("tiktok", v.title || "(video)", "", kw, biz);
        result.items.push(makeQueueItem("tiktok", v.id, `https://www.tiktok.com/@${v.author?.unique_id || ""}/video/${v.id}`, (v.title || "").slice(0, 100), v.title || "", v.author?.display_name || "", v.like_count || 0, v.comment_count || 0, generated, sentiment.sentiment, rel));
        result.queued++;
        await delay(1500 + Math.random() * 2000);
      }
    } catch (err) { console.error(`[scraper] TikTok "${kw}":`, err); }
  }
  result.items.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return result;
}

// ─── Auto-Post ───────────────────────────────────────────────────────────────

interface PostAccounts {
  reddit?: { accessToken: string; username: string };
  x?: { accessToken: string; userId: string };
  instagram?: { accessToken: string; igUserId: string };
  facebook?: { pageAccessToken: string; pageId: string };
}

export async function postApprovedItems(
  email: string, accounts: PostAccounts
): Promise<{ posted: number; errors: string[] }> {
  const items = await getQueue(email);
  const approved = items.filter(i => i.status === "approved");
  const results = { posted: 0, errors: [] as string[] };

  for (const item of approved) {
    try {
      let success = false;

      if (item.platform === "reddit" && accounts.reddit) {
        const res = await redditApi.reply(item.targetId, item.generatedComment, accounts.reddit);
        success = res.success;
      } else if (item.platform === "x" && accounts.x) {
        const res = await xApi.replyToTweet(item.targetId, item.generatedComment, accounts.x);
        success = res.success;
      } else if (item.platform === "instagram" && accounts.instagram) {
        const res = await instagramApi.commentOnMedia(item.targetId, item.generatedComment, accounts.instagram);
        success = res.success;
      } else if (item.platform === "facebook" && accounts.facebook) {
        const res = await facebookApi.replyToComment(item.targetId, item.generatedComment, accounts.facebook);
        success = res.success;
      }

      if (success) {
        item.status = "posted";
        await markEngaged(item.platform, `${item.platform}_${email}`, item.targetId);
        results.posted++;
      } else {
        results.errors.push(`Failed: ${item.platform}/${item.targetId}`);
      }

      await delay(5000 + Math.random() * 10000);
    } catch (err) {
      results.errors.push(`Error: ${item.id}: ${err}`);
    }
  }

  await store.set(queueKey(email), JSON.stringify(items), QUEUE_TTL);
  return results;
}
