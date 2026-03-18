/**
 * Performance Learning — Track outcomes, learn what works, auto-optimize
 *
 * Architecture:
 *  1. When the agent posts → record the comment with metadata (platform, style, topic, length)
 *  2. Cron job checks back 4-24hrs later → did it get replies, likes, follows?
 *  3. Store performance metrics per comment
 *  4. Analyze patterns → which styles/lengths/tones/topics perform best
 *  5. Inject insights into AI prompt → "Your sarcastic replies get 3x more upvotes"
 *
 * This is the moat — the agent gets smarter over time, making it harder to switch away.
 */

import * as store from "./store";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrackedComment {
  id: string;
  userEmail: string;
  platform: string;
  action: string;          // "comment_reply", "hashtag_comment", etc.
  targetId: string;        // Post/comment ID on the platform
  commentId?: string;      // Our comment's ID on the platform (if available)
  content: string;         // What we posted
  contentLength: number;
  // Classification
  tone: CommentTone;
  hasQuestion: boolean;
  hasEmoji: boolean;
  hasCTA: boolean;         // Call to action
  topicKeywords: string[];
  sentiment: string;       // Sentiment of original post we replied to
  // Timing
  postedAt: number;
  checkedAt?: number;
  // Outcomes (filled in by outcome checker)
  outcomes?: CommentOutcomes;
}

export interface CommentOutcomes {
  replies: number;
  likes: number;
  upvotes?: number;
  shares?: number;
  profileVisits?: number;
  followsGained?: number;
  engagementRate: number;  // (replies + likes) / impressions, or raw score
  isTopPerformer: boolean; // Top 20% by engagement
}

export type CommentTone =
  | "helpful"       // Answering a question, sharing info
  | "witty"         // Humor, sarcasm, clever wordplay
  | "empathetic"    // Understanding, supportive
  | "professional"  // Business-like, formal
  | "casual"        // Relaxed, conversational
  | "enthusiastic"  // High energy, exclamation marks
  | "contrarian";   // Disagreeing, offering different perspective

export interface PerformanceInsights {
  totalTracked: number;
  avgEngagement: number;
  // What works best
  bestTone: { tone: CommentTone; avgEngagement: number } | null;
  bestLength: { range: string; avgEngagement: number } | null;
  bestPlatform: { platform: string; avgEngagement: number } | null;
  bestTimeOfDay: { hour: number; avgEngagement: number } | null;
  // Specific learnings
  questionBoost: number;    // % improvement when comment includes a question
  emojiBoost: number;       // % improvement when using emojis
  ctaBoost: number;         // % improvement when including a CTA
  // Top performing comments (to learn from)
  topComments: { content: string; platform: string; engagement: number }[];
  // Generated prompt guidance
  promptGuidance: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const TRACKED_TTL = 90 * 24 * 3600; // 90 days
const INSIGHTS_TTL = 24 * 3600;     // Recalculate daily

function trackedKey(email: string): string { return `perf:tracked:${email}`; }
function insightsKey(email: string): string { return `perf:insights:${email}`; }

// ─── Classify Comment ────────────────────────────────────────────────────────

/**
 * Classify a comment's tone automatically
 */
export function classifyTone(content: string): CommentTone {
  const lower = content.toLowerCase();

  if (/\b(lol|lmao|😂|😭|haha|🤣|💀)\b/.test(lower)) return "witty";
  if (/\b(sorry to hear|understand|must be|that sucks|❤️|🙏)\b/.test(lower)) return "empathetic";
  if (/[!]{2,}|🔥|🚀|amazing|love this|incredible/i.test(lower)) return "enthusiastic";
  if (/\b(actually|disagree|however|on the other hand|unpopular opinion)\b/.test(lower)) return "contrarian";
  if (/\b(here's how|step \d|tip:|pro tip|the key is|you should)\b/.test(lower)) return "helpful";
  if (/\b(regarding|furthermore|additionally|per our|please note)\b/.test(lower)) return "professional";

  return "casual";
}

/**
 * Extract topic keywords from content
 */
function extractTopics(content: string): string[] {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "out", "off", "over", "under", "again", "further", "then", "once", "that", "this", "these", "those", "and", "but", "or", "nor", "not", "so", "yet", "both", "each", "few", "more", "most", "other", "some", "such", "no", "only", "own", "same", "than", "too", "very", "just", "don", "now", "it", "its", "your", "you", "i", "my", "me", "we", "our", "they", "them", "their", "what", "which", "who", "whom", "how", "all", "any"]);
  return content.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 10);
}

// ─── Track a Comment ─────────────────────────────────────────────────────────

/**
 * Record a posted comment for performance tracking
 */
export async function trackComment(
  userEmail: string,
  platform: string,
  action: string,
  targetId: string,
  content: string,
  originalSentiment: string,
  commentId?: string
): Promise<string> {
  const id = `tc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const tracked: TrackedComment = {
    id,
    userEmail,
    platform,
    action,
    targetId,
    commentId,
    content,
    contentLength: content.length,
    tone: classifyTone(content),
    hasQuestion: /\?/.test(content),
    hasEmoji: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(content),
    hasCTA: /\b(check out|try|visit|dm|message|link|sign up|click)\b/i.test(content),
    topicKeywords: extractTopics(content),
    sentiment: originalSentiment,
    postedAt: Date.now(),
  };

  // Store the tracked comment
  await store.setJSON(`perf:comment:${userEmail}:${id}`, tracked, TRACKED_TTL);

  // Add to user's tracked list
  const listKey = trackedKey(userEmail);
  const existing = await store.getJSON<string[]>(listKey) || [];
  existing.push(id);
  if (existing.length > 1000) existing.splice(0, existing.length - 1000);
  await store.setJSON(listKey, existing, TRACKED_TTL);

  // Register user as active for the outcome checker cron
  await store.addToSet("perf:active_users", userEmail, TRACKED_TTL);

  return id;
}

// ─── Record Outcomes ─────────────────────────────────────────────────────────

/**
 * Update a tracked comment with its outcomes
 * Called by the outcome-checker cron job
 */
export async function recordOutcomes(
  userEmail: string,
  trackedId: string,
  outcomes: CommentOutcomes
): Promise<void> {
  const comment = await store.getJSON<TrackedComment>(`perf:comment:${userEmail}:${trackedId}`);
  if (!comment) return;

  comment.outcomes = outcomes;
  comment.checkedAt = Date.now();

  await store.setJSON(`perf:comment:${userEmail}:${trackedId}`, comment, TRACKED_TTL);

  // Invalidate cached insights
  await store.del(insightsKey(userEmail));
}

// ─── Analyze Performance ─────────────────────────────────────────────────────

/**
 * Get all tracked comments with outcomes for a user
 */
async function getTrackedWithOutcomes(userEmail: string): Promise<TrackedComment[]> {
  const ids = await store.getJSON<string[]>(trackedKey(userEmail)) || [];
  const comments: TrackedComment[] = [];

  for (const id of ids.slice(-200)) { // Last 200 for analysis
    const c = await store.getJSON<TrackedComment>(`perf:comment:${userEmail}:${id}`);
    if (c?.outcomes) comments.push(c);
  }

  return comments;
}

/**
 * Generate performance insights from tracked data
 */
export async function getInsights(userEmail: string): Promise<PerformanceInsights> {
  // Check cache first
  const cached = await store.getJSON<PerformanceInsights>(insightsKey(userEmail));
  if (cached) return cached;

  const comments = await getTrackedWithOutcomes(userEmail);

  const defaultInsights: PerformanceInsights = {
    totalTracked: 0, avgEngagement: 0,
    bestTone: null, bestLength: null, bestPlatform: null, bestTimeOfDay: null,
    questionBoost: 0, emojiBoost: 0, ctaBoost: 0,
    topComments: [],
    promptGuidance: "Not enough data yet. Keep engaging — insights will appear after ~20 tracked comments.",
  };

  if (comments.length < 5) {
    return defaultInsights;
  }

  const totalEngagement = comments.reduce((sum, c) => sum + (c.outcomes?.engagementRate || 0), 0);
  const avgEngagement = totalEngagement / comments.length;

  // ─── Best tone ───
  const toneGroups = new Map<CommentTone, number[]>();
  for (const c of comments) {
    const arr = toneGroups.get(c.tone) || [];
    arr.push(c.outcomes?.engagementRate || 0);
    toneGroups.set(c.tone, arr);
  }
  let bestTone: PerformanceInsights["bestTone"] = null;
  let bestToneAvg = 0;
  for (const [tone, rates] of toneGroups) {
    if (rates.length < 3) continue; // Need at least 3 samples
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg > bestToneAvg) { bestToneAvg = avg; bestTone = { tone, avgEngagement: avg }; }
  }

  // ─── Best length range ───
  const lengthRanges: { range: string; min: number; max: number }[] = [
    { range: "short (< 50 chars)", min: 0, max: 50 },
    { range: "medium (50-150 chars)", min: 50, max: 150 },
    { range: "long (150-300 chars)", min: 150, max: 300 },
    { range: "very long (300+ chars)", min: 300, max: Infinity },
  ];
  let bestLength: PerformanceInsights["bestLength"] = null;
  let bestLenAvg = 0;
  for (const lr of lengthRanges) {
    const inRange = comments.filter(c => c.contentLength >= lr.min && c.contentLength < lr.max);
    if (inRange.length < 3) continue;
    const avg = inRange.reduce((sum, c) => sum + (c.outcomes?.engagementRate || 0), 0) / inRange.length;
    if (avg > bestLenAvg) { bestLenAvg = avg; bestLength = { range: lr.range, avgEngagement: avg }; }
  }

  // ─── Best platform ───
  const platformGroups = new Map<string, number[]>();
  for (const c of comments) {
    const arr = platformGroups.get(c.platform) || [];
    arr.push(c.outcomes?.engagementRate || 0);
    platformGroups.set(c.platform, arr);
  }
  let bestPlatform: PerformanceInsights["bestPlatform"] = null;
  let bestPlatAvg = 0;
  for (const [platform, rates] of platformGroups) {
    if (rates.length < 3) continue;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg > bestPlatAvg) { bestPlatAvg = avg; bestPlatform = { platform, avgEngagement: avg }; }
  }

  // ─── Best time of day ───
  const hourGroups = new Map<number, number[]>();
  for (const c of comments) {
    const hour = new Date(c.postedAt).getHours();
    const arr = hourGroups.get(hour) || [];
    arr.push(c.outcomes?.engagementRate || 0);
    hourGroups.set(hour, arr);
  }
  let bestTimeOfDay: PerformanceInsights["bestTimeOfDay"] = null;
  let bestHourAvg = 0;
  for (const [hour, rates] of hourGroups) {
    if (rates.length < 2) continue;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (avg > bestHourAvg) { bestHourAvg = avg; bestTimeOfDay = { hour, avgEngagement: avg }; }
  }

  // ─── Feature boosts (question, emoji, CTA) ───
  const withQ = comments.filter(c => c.hasQuestion);
  const withoutQ = comments.filter(c => !c.hasQuestion);
  const avgQ = withQ.length > 0 ? withQ.reduce((s, c) => s + (c.outcomes?.engagementRate || 0), 0) / withQ.length : 0;
  const avgNoQ = withoutQ.length > 0 ? withoutQ.reduce((s, c) => s + (c.outcomes?.engagementRate || 0), 0) / withoutQ.length : 0;
  const questionBoost = avgNoQ > 0 ? Math.round(((avgQ - avgNoQ) / avgNoQ) * 100) : 0;

  const withE = comments.filter(c => c.hasEmoji);
  const withoutE = comments.filter(c => !c.hasEmoji);
  const avgE = withE.length > 0 ? withE.reduce((s, c) => s + (c.outcomes?.engagementRate || 0), 0) / withE.length : 0;
  const avgNoE = withoutE.length > 0 ? withoutE.reduce((s, c) => s + (c.outcomes?.engagementRate || 0), 0) / withoutE.length : 0;
  const emojiBoost = avgNoE > 0 ? Math.round(((avgE - avgNoE) / avgNoE) * 100) : 0;

  const withCTA = comments.filter(c => c.hasCTA);
  const withoutCTA = comments.filter(c => !c.hasCTA);
  const avgCTA = withCTA.length > 0 ? withCTA.reduce((s, c) => s + (c.outcomes?.engagementRate || 0), 0) / withCTA.length : 0;
  const avgNoCTA = withoutCTA.length > 0 ? withoutCTA.reduce((s, c) => s + (c.outcomes?.engagementRate || 0), 0) / withoutCTA.length : 0;
  const ctaBoost = avgNoCTA > 0 ? Math.round(((avgCTA - avgNoCTA) / avgNoCTA) * 100) : 0;

  // ─── Top comments ───
  const sorted = [...comments].sort((a, b) => (b.outcomes?.engagementRate || 0) - (a.outcomes?.engagementRate || 0));
  const topComments = sorted.slice(0, 5).map(c => ({
    content: c.content, platform: c.platform, engagement: c.outcomes?.engagementRate || 0,
  }));

  // ─── Generate prompt guidance ───
  const promptGuidance = generatePromptGuidance({
    bestTone, bestLength, bestPlatform, bestTimeOfDay,
    questionBoost, emojiBoost, ctaBoost, topComments,
    avgEngagement, totalTracked: comments.length,
  });

  const insights: PerformanceInsights = {
    totalTracked: comments.length,
    avgEngagement,
    bestTone, bestLength, bestPlatform, bestTimeOfDay,
    questionBoost, emojiBoost, ctaBoost,
    topComments,
    promptGuidance,
  };

  // Cache for 24 hours
  await store.setJSON(insightsKey(userEmail), insights, INSIGHTS_TTL);

  return insights;
}

// ─── Generate AI Prompt Guidance ─────────────────────────────────────────────

function generatePromptGuidance(data: {
  bestTone: PerformanceInsights["bestTone"];
  bestLength: PerformanceInsights["bestLength"];
  bestPlatform: PerformanceInsights["bestPlatform"];
  bestTimeOfDay: PerformanceInsights["bestTimeOfDay"];
  questionBoost: number;
  emojiBoost: number;
  ctaBoost: number;
  topComments: { content: string; engagement: number }[];
  avgEngagement: number;
  totalTracked: number;
}): string {
  const lines: string[] = [
    `PERFORMANCE LEARNING (based on ${data.totalTracked} tracked comments):`,
  ];

  if (data.bestTone) {
    lines.push(`BEST TONE: "${data.bestTone.tone}" comments perform ${Math.round((data.bestTone.avgEngagement / data.avgEngagement - 1) * 100)}% above average. Lean into this style.`);
  }

  if (data.bestLength) {
    lines.push(`OPTIMAL LENGTH: ${data.bestLength.range} comments perform best. Aim for this range.`);
  }

  if (data.questionBoost > 10) {
    lines.push(`QUESTIONS WORK: Comments with a question get ${data.questionBoost}% more engagement. End with a question ~50% of the time.`);
  } else if (data.questionBoost < -10) {
    lines.push(`SKIP QUESTIONS: Comments with questions actually perform ${Math.abs(data.questionBoost)}% worse. Make statements instead.`);
  }

  if (data.emojiBoost > 10) {
    lines.push(`EMOJIS HELP: +${data.emojiBoost}% engagement with emojis. Use 1-2 per comment.`);
  } else if (data.emojiBoost < -10) {
    lines.push(`SKIP EMOJIS: Emojis hurt engagement by ${Math.abs(data.emojiBoost)}%. Keep it text-only.`);
  }

  if (data.ctaBoost > 10) {
    lines.push(`CTAs WORK: Comments with a call-to-action get ${data.ctaBoost}% more engagement.`);
  } else if (data.ctaBoost < -10) {
    lines.push(`NO HARD SELL: CTAs reduce engagement by ${Math.abs(data.ctaBoost)}%. Be helpful, not salesy.`);
  }

  if (data.topComments.length > 0) {
    lines.push(`\nTOP PERFORMING COMMENTS (learn from these):`);
    for (const tc of data.topComments.slice(0, 3)) {
      lines.push(`  - "${tc.content.slice(0, 120)}..." (engagement: ${tc.engagement.toFixed(1)})`);
    }
  }

  return lines.join("\n");
}


