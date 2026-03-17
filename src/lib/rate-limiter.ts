/**
 * Rate Limiter — Per-account, per-action throttling
 * 
 * Uses sliding window counters to enforce safe engagement rates.
 * Randomizes timing to mimic human patterns.
 */

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
  minDelayMs: number;      // Minimum delay between actions (ms)
  maxDelayMs: number;      // Maximum delay (randomized for human-like behavior)
  riskTier: RiskTier;
  requiresApproval: boolean;
  description: string;
}

// Rate limits per action type
export const RATE_LIMITS: Record<ActionType, RateLimitConfig> = {
  // Tier 1 — Low risk, ship immediately
  reply_own_comment: {
    maxPerHour: 30,
    maxPerDay: 200,
    minDelayMs: 15_000,     // 15 seconds minimum between replies
    maxDelayMs: 120_000,    // up to 2 minutes
    riskTier: "low",
    requiresApproval: false,
    description: "Reply to comments on your own posts",
  },
  like_mention: {
    maxPerHour: 50,
    maxPerDay: 300,
    minDelayMs: 5_000,
    maxDelayMs: 30_000,
    riskTier: "low",
    requiresApproval: false,
    description: "Like posts that mention your account",
  },
  like_comment: {
    maxPerHour: 40,
    maxPerDay: 250,
    minDelayMs: 3_000,
    maxDelayMs: 20_000,
    riskTier: "low",
    requiresApproval: false,
    description: "Like comments on your posts",
  },

  // Tier 2 — Medium risk, ship with throttling
  comment_hashtag: {
    maxPerHour: 10,
    maxPerDay: 60,
    minDelayMs: 60_000,     // 1 minute minimum between comments
    maxDelayMs: 300_000,    // up to 5 minutes
    riskTier: "medium",
    requiresApproval: false,
    description: "Comment on posts matching target hashtags",
  },
  repost: {
    maxPerHour: 5,
    maxPerDay: 20,
    minDelayMs: 120_000,
    maxDelayMs: 600_000,
    riskTier: "medium",
    requiresApproval: false,
    description: "Share or repost content",
  },
  reply_dm_received: {
    maxPerHour: 15,
    maxPerDay: 80,
    minDelayMs: 30_000,
    maxDelayMs: 180_000,
    riskTier: "medium",
    requiresApproval: false,
    description: "Reply to DMs you received (reactive only)",
  },

  // Tier 3 — High risk, requires human approval
  dm_new_follower: {
    maxPerHour: 5,
    maxPerDay: 25,
    minDelayMs: 300_000,
    maxDelayMs: 900_000,
    riskTier: "high",
    requiresApproval: true,
    description: "Send welcome DM to new followers",
  },
  dm_cold_outreach: {
    maxPerHour: 3,
    maxPerDay: 15,
    minDelayMs: 600_000,
    maxDelayMs: 1_800_000,
    riskTier: "high",
    requiresApproval: true,
    description: "Send cold outreach DMs",
  },
  comment_campaign: {
    maxPerHour: 5,
    maxPerDay: 30,
    minDelayMs: 120_000,
    maxDelayMs: 600_000,
    riskTier: "high",
    requiresApproval: true,
    description: "High-volume comment campaigns",
  },
};

// In-memory sliding window (replace with Redis in production)
const actionWindows: Map<string, number[]> = new Map();

/**
 * Get a unique key for an account + action combination
 */
function getKey(accountId: string, action: ActionType): string {
  return `${accountId}:${action}`;
}

/**
 * Check if an action is allowed under rate limits
 */
export function canPerformAction(accountId: string, action: ActionType): {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
} {
  const config = RATE_LIMITS[action];
  const key = getKey(accountId, action);
  const now = Date.now();
  const hourAgo = now - 3_600_000;
  const dayAgo = now - 86_400_000;

  // Get existing action timestamps
  const timestamps = actionWindows.get(key) || [];

  // Clean old entries
  const recent = timestamps.filter((t) => t > dayAgo);
  actionWindows.set(key, recent);

  // Check hourly limit
  const hourlyCount = recent.filter((t) => t > hourAgo).length;
  if (hourlyCount >= config.maxPerHour) {
    const oldestInHour = recent.filter((t) => t > hourAgo).sort()[0];
    const retryAfterMs = oldestInHour + 3_600_000 - now;
    return {
      allowed: false,
      reason: `Hourly limit reached (${hourlyCount}/${config.maxPerHour}). Try again in ${Math.ceil(retryAfterMs / 60_000)} minutes.`,
      retryAfterMs,
    };
  }

  // Check daily limit
  if (recent.length >= config.maxPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${recent.length}/${config.maxPerDay}). Try again tomorrow.`,
      retryAfterMs: dayAgo + 86_400_000 - now,
    };
  }

  // Check minimum delay since last action
  const lastAction = recent.length > 0 ? Math.max(...recent) : 0;
  if (lastAction > 0 && now - lastAction < config.minDelayMs) {
    const retryAfterMs = config.minDelayMs - (now - lastAction);
    return {
      allowed: false,
      reason: `Too soon since last action. Wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
      retryAfterMs,
    };
  }

  return { allowed: true };
}

/**
 * Record that an action was performed
 */
export function recordAction(accountId: string, action: ActionType): void {
  const key = getKey(accountId, action);
  const timestamps = actionWindows.get(key) || [];
  timestamps.push(Date.now());
  actionWindows.set(key, timestamps);
}

/**
 * Get a randomized delay for natural pacing
 */
export function getHumanDelay(action: ActionType): number {
  const config = RATE_LIMITS[action];
  return config.minDelayMs + Math.random() * (config.maxDelayMs - config.minDelayMs);
}

/**
 * Get current usage stats for an account
 */
export function getUsageStats(accountId: string): Record<ActionType, { hourly: number; daily: number; limit: { hourly: number; daily: number } }> {
  const now = Date.now();
  const hourAgo = now - 3_600_000;
  const dayAgo = now - 86_400_000;

  const stats = {} as Record<ActionType, { hourly: number; daily: number; limit: { hourly: number; daily: number } }>;

  for (const action of Object.keys(RATE_LIMITS) as ActionType[]) {
    const key = getKey(accountId, action);
    const timestamps = actionWindows.get(key) || [];
    const config = RATE_LIMITS[action];

    stats[action] = {
      hourly: timestamps.filter((t) => t > hourAgo).length,
      daily: timestamps.filter((t) => t > dayAgo).length,
      limit: {
        hourly: config.maxPerHour,
        daily: config.maxPerDay,
      },
    };
  }

  return stats;
}
