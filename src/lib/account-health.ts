/**
 * Account Health Monitor — Track account safety signals
 * 
 * Monitors for soft bans, comment removals, and other red flags.
 * Auto-pauses accounts when risk is detected.
 */

export type HealthStatus = "healthy" | "warning" | "paused" | "suspended";

export type IncidentType =
  | "comment_removed"      // Platform removed a comment
  | "action_blocked"       // Platform blocked an action
  | "rate_limit_hit"       // Hit platform's own rate limit
  | "dm_bounced"           // DM couldn't be delivered
  | "soft_ban"             // Temporary restriction from platform
  | "hard_ban"             // Account suspended
  | "api_error"            // Unexpected API error
  | "content_flagged";     // Platform flagged content

interface Incident {
  type: IncidentType;
  timestamp: Date;
  platform: string;
  details: string;
  accountId: string;
}

interface AccountHealth {
  accountId: string;
  platform: string;
  status: HealthStatus;
  incidents: Incident[];
  pausedUntil: Date | null;
  riskScore: number;         // 0-100
  lastChecked: Date;
  totalActionsToday: number;
  successRate: number;       // 0-1
}

// Auto-pause rules
const PAUSE_RULES = {
  comment_removed: { threshold: 2, pauseHours: 24, message: "2+ comments removed — paused for 24 hours" },
  action_blocked: { threshold: 3, pauseHours: 12, message: "3+ actions blocked — paused for 12 hours" },
  dm_bounced: { threshold: 3, pauseHours: 48, message: "3+ DMs bounced — DM automation disabled for 48 hours" },
  soft_ban: { threshold: 1, pauseHours: 72, message: "Soft ban detected — paused for 72 hours" },
  hard_ban: { threshold: 1, pauseHours: -1, message: "Account suspended — all automation disabled" },
  rate_limit_hit: { threshold: 5, pauseHours: 6, message: "Hitting platform rate limits — slowing down for 6 hours" },
  content_flagged: { threshold: 2, pauseHours: 24, message: "Content flagged — paused for 24 hours" },
  api_error: { threshold: 10, pauseHours: 1, message: "Too many API errors — paused for 1 hour" },
};

// In-memory store (replace with database in production)
const healthStore: Map<string, AccountHealth> = new Map();

/**
 * Get or create account health record
 */
export function getAccountHealth(accountId: string, platform: string): AccountHealth {
  const key = `${accountId}:${platform}`;
  if (!healthStore.has(key)) {
    healthStore.set(key, {
      accountId,
      platform,
      status: "healthy",
      incidents: [],
      pausedUntil: null,
      riskScore: 0,
      lastChecked: new Date(),
      totalActionsToday: 0,
      successRate: 1,
    });
  }
  return healthStore.get(key)!;
}

/**
 * Report an incident and check if account should be paused
 */
export function reportIncident(
  accountId: string,
  platform: string,
  type: IncidentType,
  details: string
): { paused: boolean; message: string; pausedUntil?: Date } {
  const health = getAccountHealth(accountId, platform);

  // Record the incident
  const incident: Incident = {
    type,
    timestamp: new Date(),
    platform,
    details,
    accountId,
  };
  health.incidents.push(incident);

  // Count recent incidents of this type (last 24 hours)
  const dayAgo = new Date(Date.now() - 86_400_000);
  const recentOfType = health.incidents.filter(
    (i) => i.type === type && i.timestamp > dayAgo
  ).length;

  // Check pause rules
  const rule = PAUSE_RULES[type];
  if (recentOfType >= rule.threshold) {
    if (rule.pauseHours === -1) {
      // Permanent pause (hard ban)
      health.status = "suspended";
      health.pausedUntil = null;
      return {
        paused: true,
        message: rule.message,
      };
    }

    const pausedUntil = new Date(Date.now() + rule.pauseHours * 3_600_000);
    health.status = "paused";
    health.pausedUntil = pausedUntil;

    return {
      paused: true,
      message: rule.message,
      pausedUntil,
    };
  }

  // Update risk score
  health.riskScore = calculateRiskScore(health);

  if (health.riskScore > 70) {
    health.status = "warning";
  }

  return {
    paused: false,
    message: `Incident recorded: ${details}`,
  };
}

/**
 * Check if an account is currently safe to use
 */
export function isAccountSafe(accountId: string, platform: string): {
  safe: boolean;
  status: HealthStatus;
  reason?: string;
  resumesAt?: Date;
} {
  const health = getAccountHealth(accountId, platform);

  // Check if suspended
  if (health.status === "suspended") {
    return {
      safe: false,
      status: "suspended",
      reason: "Account has been suspended. Please reconnect manually.",
    };
  }

  // Check if paused
  if (health.status === "paused" && health.pausedUntil) {
    if (new Date() < health.pausedUntil) {
      return {
        safe: false,
        status: "paused",
        reason: "Account temporarily paused for safety",
        resumesAt: health.pausedUntil,
      };
    } else {
      // Pause expired, reset to healthy
      health.status = "healthy";
      health.pausedUntil = null;
    }
  }

  // Check risk score
  if (health.riskScore > 80) {
    return {
      safe: false,
      status: "warning",
      reason: "Account risk score is too high. Reduce engagement activity.",
    };
  }

  return { safe: true, status: health.status };
}

/**
 * Calculate risk score based on recent incidents
 */
function calculateRiskScore(health: AccountHealth): number {
  const dayAgo = new Date(Date.now() - 86_400_000);
  const recentIncidents = health.incidents.filter((i) => i.timestamp > dayAgo);

  const weights: Record<IncidentType, number> = {
    comment_removed: 15,
    action_blocked: 20,
    rate_limit_hit: 10,
    dm_bounced: 12,
    soft_ban: 50,
    hard_ban: 100,
    api_error: 5,
    content_flagged: 25,
  };

  let score = 0;
  for (const incident of recentIncidents) {
    score += weights[incident.type] || 5;
  }

  return Math.min(score, 100);
}

/**
 * Get health summary for all accounts
 */
export function getAllAccountHealth(): AccountHealth[] {
  return Array.from(healthStore.values());
}

/**
 * Manually resume a paused account
 */
export function resumeAccount(accountId: string, platform: string): void {
  const health = getAccountHealth(accountId, platform);
  if (health.status === "paused") {
    health.status = "healthy";
    health.pausedUntil = null;
    health.riskScore = Math.max(0, health.riskScore - 20);
  }
}
