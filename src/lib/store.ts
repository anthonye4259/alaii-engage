/**
 * Persistent Store — Upstash Redis REST API with in-memory fallback
 *
 * Uses Upstash's HTTP-based Redis API (zero npm deps — just fetch).
 * Falls back to in-memory Map when UPSTASH_REDIS_REST_URL is not set (dev mode).
 *
 * Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

// ---------------------------------------------------------------------------
// In-memory fallback store (used when Redis is not configured)
// ---------------------------------------------------------------------------
const memStore = new Map<string, { value: string; expiresAt: number | null }>();
const memSets = new Map<string, Set<string>>();

function memCleanup() {
  const now = Date.now();
  for (const [key, entry] of memStore.entries()) {
    if (entry.expiresAt && entry.expiresAt < now) memStore.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Redis REST client
// ---------------------------------------------------------------------------
function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisCommand<T = unknown>(command: string[]): Promise<T> {
  const config = getRedisConfig();
  if (!config) throw new Error("Redis not configured");

  const res = await fetch(`${config.url}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.result as T;
}

function isRedisAvailable(): boolean {
  return !!getRedisConfig();
}

// ---------------------------------------------------------------------------
// Public API — all methods work with Redis or fallback to in-memory
// ---------------------------------------------------------------------------

/**
 * Set a key-value pair with optional TTL (seconds)
 */
export async function set(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (isRedisAvailable()) {
    if (ttlSeconds) {
      await redisCommand(["SET", key, value, "EX", String(ttlSeconds)]);
    } else {
      await redisCommand(["SET", key, value]);
    }
  } else {
    memStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }
}

/**
 * Get a value by key
 */
export async function get(key: string): Promise<string | null> {
  if (isRedisAvailable()) {
    return await redisCommand<string | null>(["GET", key]);
  } else {
    memCleanup();
    const entry = memStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memStore.delete(key);
      return null;
    }
    return entry.value;
  }
}

/**
 * Delete a key
 */
export async function del(key: string): Promise<void> {
  if (isRedisAvailable()) {
    await redisCommand(["DEL", key]);
  } else {
    memStore.delete(key);
  }
}

/**
 * Increment a counter with TTL — perfect for sliding window rate limits.
 * Returns the new count after incrementing.
 */
export async function increment(key: string, ttlSeconds?: number): Promise<number> {
  if (isRedisAvailable()) {
    const count = await redisCommand<number>(["INCR", key]);
    // Set TTL only on first increment (when count === 1)
    if (count === 1 && ttlSeconds) {
      await redisCommand(["EXPIRE", key, String(ttlSeconds)]);
    }
    return count;
  } else {
    memCleanup();
    const entry = memStore.get(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const newCount = current + 1;
    memStore.set(key, {
      value: String(newCount),
      expiresAt: newCount === 1 && ttlSeconds ? Date.now() + ttlSeconds * 1000 : entry?.expiresAt ?? null,
    });
    return newCount;
  }
}

/**
 * Get current value of a counter
 */
export async function getCount(key: string): Promise<number> {
  const val = await get(key);
  return val ? parseInt(val, 10) || 0 : 0;
}

/**
 * Add a member to a set (for deduplication)
 */
export async function addToSet(key: string, member: string, ttlSeconds?: number): Promise<void> {
  if (isRedisAvailable()) {
    await redisCommand(["SADD", key, member]);
    if (ttlSeconds) {
      // Only set TTL if not already set (preserves existing TTL)
      const ttl = await redisCommand<number>(["TTL", key]);
      if (ttl === -1) {
        await redisCommand(["EXPIRE", key, String(ttlSeconds)]);
      }
    }
  } else {
    if (!memSets.has(key)) memSets.set(key, new Set());
    memSets.get(key)!.add(member);
  }
}

/**
 * Check if a member exists in a set
 */
export async function isMember(key: string, member: string): Promise<boolean> {
  if (isRedisAvailable()) {
    const result = await redisCommand<number>(["SISMEMBER", key, member]);
    return result === 1;
  } else {
    return memSets.get(key)?.has(member) ?? false;
  }
}

/**
 * Set JSON data with optional TTL
 */
export async function setJSON<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
  await set(key, JSON.stringify(data), ttlSeconds);
}

/**
 * Get JSON data
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Check if Redis is configured and healthy
 */
export async function healthCheck(): Promise<{ available: boolean; type: "redis" | "memory" }> {
  if (!isRedisAvailable()) {
    return { available: true, type: "memory" };
  }
  try {
    await redisCommand(["PING"]);
    return { available: true, type: "redis" };
  } catch {
    return { available: false, type: "redis" };
  }
}
