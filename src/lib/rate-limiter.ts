/**
 * Rate Limiter — Per-account, per-action throttling (Redis-backed)
 *
 * Uses sliding window counters backed by Upstash Redis.
 * Falls back to in-memory when Redis is not configured.
 * Randomizes timing to mimic human patterns.
 */

import * as store from "./store";

export type ActionType =
  | "reply_own_comment"    // Reply to comments on YOUR posts (safest)
  | "like_mention"         // Like posts that mention you
  | "like_comment"         // Like comments on your posts
  | "comment_hashtag"      // Comment on hashtag posts (medium risk)
  | "repost"               // Repost/share content
  | "reply_dm_received"    // Reply to DMs you received (reactive)
  | "dm_new_follower"      // DM new followers (high risk — needs approval)
  | "dm_cold_outreach"     // Cold outreach DMs (high risk — needs approval)
  | "comment_campaign";    // High-volume comment campaigns (needs approval)

export type RiskTier = "low" | "medium" | "high";

interface RateLimitConfig {
  maxPerHour: number;
  maxPerDay: number;
  minDelayMs: number;
  maxDelayMs: number;
  riskTier: RiskTier;
  requiresApproval: boolean;
  description: string;
}

// Rate limits per action type
export const RATE_LIMITS: Record<ActionType, RateLimitConfig> = {
  // Tier 1 — Low risk
  reply_own_comment: {
    maxPerHour: 30, maxPerDay: 200,
    minDelayMs: 15_000, maxDelayMs: 120_000,
    riskTier: "low", requiresApproval: false,
    description: "Reply to comments on your own posts",
  },
  like_mention: {
    maxPerHour: 50, maxPerDay: 300,
    minDelayMs: 5_000, maxDelayMs: 30_000,
    riskTier: "low", requiresApproval: false,
    description: "Like posts that mention your account",
  },
  like_comment: {
    maxPerHour: 40, maxPerDay: 250,
    minDelayMs: 3_000, maxDelayMs: 20_000,
    riskTier: "low", requiresApproval: false,
    description: "Like comments on your posts",
  },

  // Tier 2 — Medium risk
  comment_hashtag: {
    maxPerHour: 10, maxPerDay: 60,
    minDelayMs: 60_000, maxDelayMs: 300_000,
    riskTier: "medium", requiresApproval: false,
    description: "Comment on posts matching target hashtags",
  },
  repost: {
    maxPerHour: 5, maxPerDay: 20,
    minDelayMs: 120_000, maxDelayMs: 600_000,
    riskTier: "medium", requiresApproval: false,
    description: "Share or repost content",
  },
  reply_dm_received: {
    maxPerHour: 15, maxPerDay: 80,
    minDelayMs: 30_000, maxDelayMs: 180_000,
    riskTier: "medium", requiresApproval: false,
    description: "Reply to DMs you received (reactive only)",
  },

  // Tier 3 — High risk
  dm_new_follower: {
    maxPerHour: 5, maxPerDay: 25,
    minDelayMs: 300_000, maxDelayMs: 900_000,
    riskTier: "high", requiresApproval: true,
    description: "Send welcome DM to new followers",
  },
  dm_cold_outreach: {
    maxPerHour: 3, maxPerDay: 15,
    minDelayMs: 600_000, maxDelayMs: 1_800_000,
    riskTier: "high", requiresApproval: true,
    description: "Send cold outreach DMs",
  },
  comment_campaign: {
    maxPerHour: 5, maxPerDay: 30,
    minDelayMs: 120_000, maxDelayMs: 600_000,
    riskTier: "high", requiresApproval: true,
    description: "High-volume comment campaigns",
  },
};

/**
 * Check if an action is allowed under rate limits (Redis-backed)
 */
export async function canPerformAction(accountId: string, action: ActionType): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}> {
  const config = RATE_LIMITS[action];
  const hourKey = `rate:${accountId}:${action}:hour`;
  const dayKey = `rate:${accountId}:${action}:day`;
  const lastKey = `rate:${accountId}:${action}:last`;

  // Check hourly limit
  const hourlyCount = await store.getCount(hourKey);
  if (hourlyCount >= config.maxPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${hourlyCount}/${config.maxPerHour}).`,
      retryAfterMs: 60_000, // Retry in 1 min (window will slide)
    };
  }

  // Check daily limit
  const dailyCount = await store.getCount(dayKey);
  if (dailyCount >= config.maxPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${dailyCount}/${config.maxPerDay}).`,
      retryAfterMs: 3_600_000,
    };
  }

  // Check minimum delay since last action
  const lastActionStr = await store.get(lastKey);
  if (lastActionStr) {
    const lastAction = parseInt(lastActionStr, 10);
    const elapsed = Date.now() - lastAction;
    if (elapsed < config.minDelayMs) {
      const retryAfterMs = config.minDelayMs - elapsed;
      return {
        allowed: false,
        reason: `Too soon since last action. Wait ${Math.ceil(retryAfterMs / 1000)}s.`,
        retryAfterMs,
      };
    }
  }

  return { allowed: true };
}

/**
 * Record that an action was performed (Redis-backed)
 */
export async function recordAction(accountId: string, action: ActionType): Promise<void> {
  const hourKey = `rate:${accountId}:${action}:hour`;
  const dayKey = `rate:${accountId}:${action}:day`;
  const lastKey = `rate:${accountId}:${action}:last`;

  await Promise.all([
    store.increment(hourKey, 3600),      // 1 hour TTL
    store.increment(dayKey, 86400),      // 24 hour TTL
    store.set(lastKey, String(Date.now()), 86400),
  ]);
}

/**
 * Get a randomized delay for natural pacing
 */
export function getHumanDelay(action: ActionType): number {
  const config = RATE_LIMITS[action];
  return config.minDelayMs + Math.random() * (config.maxDelayMs - config.minDelayMs);
}

/**
 * Get current usage stats for an account (Redis-backed)
 */
export async function getUsageStats(accountId: string): Promise<
  Record<ActionType, { hourly: number; daily: number; limit: { hourly: number; daily: number } }>
> {
  const stats = {} as Record<ActionType, { hourly: number; daily: number; limit: { hourly: number; daily: number } }>;

  for (const action of Object.keys(RATE_LIMITS) as ActionType[]) {
    const hourKey = `rate:${accountId}:${action}:hour`;
    const dayKey = `rate:${accountId}:${action}:day`;
    const config = RATE_LIMITS[action];

    const [hourly, daily] = await Promise.all([
      store.getCount(hourKey),
      store.getCount(dayKey),
    ]);

    stats[action] = {
      hourly,
      daily,
      limit: { hourly: config.maxPerHour, daily: config.maxPerDay },
    };
  }

  return stats;
}
