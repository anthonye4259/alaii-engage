/**
 * Connected Accounts — Store per-user OAuth tokens and platform credentials
 *
 * Each user can connect multiple platforms. Tokens stored in Redis keyed by user email.
 */

import * as store from "./store";

export interface ConnectedAccount {
  platform: string;
  handle: string;
  accessToken: string;
  refreshToken?: string;
  platformUserId?: string;  // IG account ID, Reddit username, etc.
  pageToken?: string;       // Facebook Page token
  expiresAt?: string;
  connectedAt: string;
  metadata?: Record<string, string>;  // Platform-specific extras (FB page ID, etc.)
}

const TTL = 90 * 24 * 3600; // 90 days

/**
 * Save a connected account for a user
 */
export async function saveConnectedAccount(
  userEmail: string,
  account: ConnectedAccount
): Promise<void> {
  const key = `accounts:${userEmail}`;
  const accounts = await getConnectedAccounts(userEmail);

  // Replace existing for same platform, or add new
  const idx = accounts.findIndex((a) => a.platform === account.platform);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }

  await store.setJSON(key, accounts, TTL);
}

/**
 * Get all connected accounts for a user
 */
export async function getConnectedAccounts(userEmail: string): Promise<ConnectedAccount[]> {
  return (await store.getJSON<ConnectedAccount[]>(`accounts:${userEmail}`)) || [];
}

/**
 * Remove a connected account
 */
export async function disconnectAccount(userEmail: string, platform: string): Promise<void> {
  const accounts = await getConnectedAccounts(userEmail);
  const filtered = accounts.filter((a) => a.platform !== platform);
  await store.setJSON(`accounts:${userEmail}`, filtered, TTL);
}

/**
 * Get all users who have connected accounts (for cron scanning)
 */
export async function registerActiveUser(userEmail: string): Promise<void> {
  await store.addToSet("active_users", userEmail);
}

/**
 * Get all active users (for multi-tenant cron)
 */
export async function getActiveUsers(): Promise<string[]> {
  return (await store.getSet("active_users")) || [];
}
