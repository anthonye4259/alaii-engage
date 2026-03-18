/**
 * API Usage Metering — Track and enforce per-key API usage
 *
 * Counts API calls per key per billing period (monthly).
 * Stores in Redis with auto-expiring monthly counters.
 * $0.01 per API call for pay-as-you-go users.
 */

import * as store from "./store";

const RATE_PER_CALL = 0.01; // $0.01 per API call

/**
 * Record an API call and return updated usage
 */
export async function recordApiCall(apiKey: string): Promise<{
  allowed: boolean;
  callsThisPeriod: number;
  estimatedCost: number;
}> {
  const periodKey = getCurrentPeriodKey(apiKey);

  // Increment counter (expires at end of billing period)
  const count = await store.increment(periodKey, getSecondsUntilEndOfMonth());

  return {
    allowed: true, // Pay-as-you-go has no hard limit
    callsThisPeriod: count,
    estimatedCost: Number((count * RATE_PER_CALL).toFixed(2)),
  };
}

/**
 * Get current usage stats for an API key
 */
export async function getUsage(apiKey: string): Promise<{
  callsThisPeriod: number;
  estimatedCost: number;
  periodStart: string;
  periodEnd: string;
  ratePerCall: number;
}> {
  const periodKey = getCurrentPeriodKey(apiKey);
  const count = await store.getCount(periodKey);
  const now = new Date();

  return {
    callsThisPeriod: count,
    estimatedCost: Number((count * RATE_PER_CALL).toFixed(2)),
    periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    ratePerCall: RATE_PER_CALL,
  };
}

/**
 * Get the Redis key for the current billing period
 */
function getCurrentPeriodKey(apiKey: string): string {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `usage:${apiKey}:${period}`;
}

/**
 * Seconds until the end of the current month
 */
function getSecondsUntilEndOfMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
}
