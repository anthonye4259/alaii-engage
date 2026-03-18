/**
 * Engagement Logger — Track all engagement actions per user
 *
 * Stores engagement events in Redis sorted sets (by timestamp).
 * Provides stats: total, by type, by platform, and recent activity feed.
 */

import * as store from "./store";

export interface EngagementEvent {
  id: string;
  platform: string;
  action: string;       // "comment_reply", "like", "dm", etc.
  target: string;       // "@username's post", "post about X"
  detail: string;       // The actual content sent
  timestamp: string;    // ISO string
}

const EVENTS_TTL = 30 * 24 * 3600; // Keep 30 days of data

/**
 * Log an engagement event for a user
 */
export async function logEngagement(userEmail: string, event: Omit<EngagementEvent, "id" | "timestamp">): Promise<void> {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const fullEvent: EngagementEvent = {
    ...event,
    id,
    timestamp: new Date().toISOString(),
  };

  // Store event
  await store.setJSON(`engagement:${userEmail}:${id}`, fullEvent, EVENTS_TTL);

  // Add to user's event list (capped at 500)
  const listKey = `engagements:${userEmail}`;
  const existing = await store.getJSON<string[]>(listKey) || [];
  existing.unshift(id);
  if (existing.length > 500) existing.length = 500;
  await store.setJSON(listKey, existing, EVENTS_TTL);

  // Increment daily/total counters
  const today = new Date().toISOString().slice(0, 10);
  await store.increment(`stats:${userEmail}:total`, EVENTS_TTL);
  await store.increment(`stats:${userEmail}:${today}`, 86400);
  await store.increment(`stats:${userEmail}:${event.action}`, EVENTS_TTL);
  await store.increment(`stats:${userEmail}:${event.platform}`, EVENTS_TTL);

  // Fire webhook (non-blocking)
  fireWebhook(userEmail, fullEvent).catch(() => {});
}

/**
 * Fire webhook for user if they have one configured
 */
async function fireWebhook(userEmail: string, event: EngagementEvent): Promise<void> {
  const { getJSON } = await import("./store");
  const user = await getJSON<{ webhookUrl?: string }>(`user:${userEmail}`);
  if (!user?.webhookUrl) return;

  try {
    await fetch(user.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "engagement.completed",
        platform: event.platform,
        action: event.action,
        target: event.target,
        content: event.detail,
        timestamp: event.timestamp,
        id: event.id,
      }),
    });
  } catch {
    // Silently fail — don't let webhook issues break the engagement flow
  }
}

/**
 * Get recent activity feed for a user
 */
export async function getRecentActivity(userEmail: string, limit: number = 20): Promise<EngagementEvent[]> {
  const listKey = `engagements:${userEmail}`;
  const ids = await store.getJSON<string[]>(listKey) || [];

  const events: EngagementEvent[] = [];
  for (const id of ids.slice(0, limit)) {
    const event = await store.getJSON<EngagementEvent>(`engagement:${userEmail}:${id}`);
    if (event) events.push(event);
  }

  return events;
}

/**
 * Get engagement stats for a user
 */
export async function getStats(userEmail: string): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  byAction: Record<string, number>;
  byPlatform: Record<string, number>;
}> {
  const total = await store.getCount(`stats:${userEmail}:total`);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = await store.getCount(`stats:${userEmail}:${today}`);

  // Sum last 7 days
  let weekCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().slice(0, 10);
    weekCount += await store.getCount(`stats:${userEmail}:${dayKey}`);
  }

  // Get action and platform breakdowns
  const actions = ["comment_reply", "hashtag_comment", "like", "dm_welcome", "dm_outreach", "repost"];
  const platforms = ["instagram", "tiktok", "x", "linkedin", "reddit", "facebook"];

  const byAction: Record<string, number> = {};
  for (const a of actions) {
    const c = await store.getCount(`stats:${userEmail}:${a}`);
    if (c > 0) byAction[a] = c;
  }

  const byPlatform: Record<string, number> = {};
  for (const p of platforms) {
    const c = await store.getCount(`stats:${userEmail}:${p}`);
    if (c > 0) byPlatform[p] = c;
  }

  return { total, today: todayCount, thisWeek: weekCount, byAction, byPlatform };
}
