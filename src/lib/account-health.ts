/**
 * Account Health Monitor — Redis-backed safety tracking
 *
 * Monitors for soft bans, comment removals, and other red flags.
 * Auto-pauses accounts when risk is detected.
 * State persists across Vercel cold starts via Upstash Redis.
 */

import * as store from "./store";

export type HealthStatus = "healthy" | "warning" | "paused" | "suspended";

export type IncidentType =
  | "comment_removed"
  | "action_blocked"
  | "rate_limit_hit"
  | "dm_bounced"
  | "soft_ban"
  | "hard_ban"
  | "api_error"
  | "content_flagged";

interface AccountHealth {
  accountId: string;
  platform: string;
  status: HealthStatus;
  pausedUntil: string | null;  // ISO string for JSON serialization
  riskScore: number;
  lastChecked: string;
  totalActionsToday: number;
  successRate: number;
}

interface StoredIncident {
  type: IncidentType;
  timestamp: string;
  platform: string;
  details: string;
}

// Auto-pause rules
const PAUSE_RULES: Record<IncidentType, { threshold: number; pauseHours: number; message: string }> = {
  comment_removed: { threshold: 2, pauseHours: 24, message: "2+ comments removed — paused for 24 hours" },
  action_blocked: { threshold: 3, pauseHours: 12, message: "3+ actions blocked — paused for 12 hours" },
  dm_bounced: { threshold: 3, pauseHours: 48, message: "3+ DMs bounced — DM automation disabled for 48 hours" },
  soft_ban: { threshold: 1, pauseHours: 72, message: "Soft ban detected — paused for 72 hours" },
  hard_ban: { threshold: 1, pauseHours: -1, message: "Account suspended — all automation disabled" },
  rate_limit_hit: { threshold: 5, pauseHours: 6, message: "Hitting platform rate limits — slowing down for 6 hours" },
  content_flagged: { threshold: 2, pauseHours: 24, message: "Content flagged — paused for 24 hours" },
  api_error: { threshold: 10, pauseHours: 1, message: "Too many API errors — paused for 1 hour" },
};

const HEALTH_TTL = 7 * 24 * 3600; // 7 days
const INCIDENT_TTL = 24 * 3600;   // 24 hours (only recent incidents matter)

function healthKey(accountId: string, platform: string): string {
  return `health:${accountId}:${platform}`;
}

function incidentKey(accountId: string, platform: string): string {
  return `incidents:${accountId}:${platform}`;
}

/**
 * Get or create account health record (Redis-backed)
 */
export async function getAccountHealth(accountId: string, platform: string): Promise<AccountHealth> {
  const key = healthKey(accountId, platform);
  const existing = await store.getJSON<AccountHealth>(key);

  if (existing) return existing;

  const defaultHealth: AccountHealth = {
    accountId,
    platform,
    status: "healthy",
    pausedUntil: null,
    riskScore: 0,
    lastChecked: new Date().toISOString(),
    totalActionsToday: 0,
    successRate: 1,
  };

  await store.setJSON(key, defaultHealth, HEALTH_TTL);
  return defaultHealth;
}

/**
 * Save account health to store
 */
async function saveHealth(health: AccountHealth): Promise<void> {
  const key = healthKey(health.accountId, health.platform);
  health.lastChecked = new Date().toISOString();
  await store.setJSON(key, health, HEALTH_TTL);
}

/**
 * Report an incident and check if account should be paused (Redis-backed)
 */
export async function reportIncident(
  accountId: string,
  platform: string,
  type: IncidentType,
  details: string
): Promise<{ paused: boolean; message: string; pausedUntil?: Date }> {
  const health = await getAccountHealth(accountId, platform);

  // Store incident — use a counter per incident type (24h TTL)
  const incKey = `${incidentKey(accountId, platform)}:${type}`;
  const recentCount = await store.increment(incKey, INCIDENT_TTL);

  // Also store the incident detail for debugging
  const detailKey = `${incidentKey(accountId, platform)}:latest`;
  const incident: StoredIncident = {
    type,
    timestamp: new Date().toISOString(),
    platform,
    details,
  };
  await store.setJSON(detailKey, incident, INCIDENT_TTL);

  // Check pause rules
  const rule = PAUSE_RULES[type];
  if (recentCount >= rule.threshold) {
    if (rule.pauseHours === -1) {
      health.status = "suspended";
      health.pausedUntil = null;
      await saveHealth(health);
      return { paused: true, message: rule.message };
    }

    const pausedUntil = new Date(Date.now() + rule.pauseHours * 3_600_000);
    health.status = "paused";
    health.pausedUntil = pausedUntil.toISOString();
    await saveHealth(health);

    return { paused: true, message: rule.message, pausedUntil };
  }

  // Update risk score
  health.riskScore = calculateRiskScore(recentCount, type);
  if (health.riskScore > 70) {
    health.status = "warning";
  }
  await saveHealth(health);

  return { paused: false, message: `Incident recorded: ${details}` };
}

/**
 * Check if an account is currently safe to use (Redis-backed)
 */
export async function isAccountSafe(accountId: string, platform: string): Promise<{
  safe: boolean;
  status: HealthStatus;
  reason?: string;
  resumesAt?: Date;
}> {
  const health = await getAccountHealth(accountId, platform);

  if (health.status === "suspended") {
    return {
      safe: false,
      status: "suspended",
      reason: "Account has been suspended. Please reconnect manually.",
    };
  }

  if (health.status === "paused" && health.pausedUntil) {
    const pausedUntilDate = new Date(health.pausedUntil);
    if (new Date() < pausedUntilDate) {
      return {
        safe: false,
        status: "paused",
        reason: "Account temporarily paused for safety",
        resumesAt: pausedUntilDate,
      };
    } else {
      // Pause expired
      health.status = "healthy";
      health.pausedUntil = null;
      health.riskScore = Math.max(0, health.riskScore - 20);
      await saveHealth(health);
    }
  }

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
 * Calculate risk score based on incident severity and count
 */
function calculateRiskScore(recentCount: number, latestType: IncidentType): number {
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

  const weight = weights[latestType] || 5;
  return Math.min(recentCount * weight, 100);
}

/**
 * Manually resume a paused account (Redis-backed)
 */
export async function resumeAccount(accountId: string, platform: string): Promise<void> {
  const health = await getAccountHealth(accountId, platform);
  if (health.status === "paused") {
    health.status = "healthy";
    health.pausedUntil = null;
    health.riskScore = Math.max(0, health.riskScore - 20);
    await saveHealth(health);
  }
}
