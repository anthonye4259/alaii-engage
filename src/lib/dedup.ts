/**
 * Deduplication — Prevents engaging with the same content twice
 *
 * Uses Redis sets with 7-day TTL to track every comment/post/DM
 * the agent has already responded to. Each platform gets its own set.
 */

import { addToSet, isMember } from "./store";

const DEDUP_TTL_SECONDS = 7 * 24 * 3600; // 7 days
const KEY_PREFIX = "dedup";

/**
 * Build the Redis key for a platform's dedup set
 */
function dedupKey(platform: string, accountId: string): string {
  return `${KEY_PREFIX}:${platform}:${accountId}`;
}

/**
 * Check if we've already engaged with a specific target
 *
 * @param platform - The social platform (instagram, x, reddit, etc.)
 * @param accountId - The account performing the engagement
 * @param targetId - The comment/post/user ID being engaged with
 * @returns true if already engaged, false if new
 */
export async function hasEngaged(
  platform: string,
  accountId: string,
  targetId: string
): Promise<boolean> {
  const key = dedupKey(platform, accountId);
  return await isMember(key, targetId);
}

/**
 * Mark a target as engaged with
 *
 * @param platform - The social platform
 * @param accountId - The account that performed the action
 * @param targetId - The comment/post/user ID that was engaged with
 */
export async function markEngaged(
  platform: string,
  accountId: string,
  targetId: string
): Promise<void> {
  const key = dedupKey(platform, accountId);
  await addToSet(key, targetId, DEDUP_TTL_SECONDS);
}

/**
 * Batch check — filter out already-engaged targets from a list
 *
 * @param platform - The social platform
 * @param accountId - The account performing the engagement
 * @param targetIds - Array of target IDs to check
 * @returns Only the IDs that haven't been engaged with yet
 */
export async function filterNew(
  platform: string,
  accountId: string,
  targetIds: string[]
): Promise<string[]> {
  const results: string[] = [];
  for (const id of targetIds) {
    const seen = await hasEngaged(platform, accountId, id);
    if (!seen) results.push(id);
  }
  return results;
}
