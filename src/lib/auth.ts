/**
 * Auth — Email + Password with Redis sessions
 *
 * Agent-friendly: POST /api/auth/signup or /api/auth/login with JSON body.
 * Passwords hashed with Web Crypto (no npm deps).
 * Sessions stored in Upstash Redis with 30-day TTL.
 */

import * as store from "./store";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_TTL = 30 * 24 * 3600; // 30 days
const SESSION_COOKIE = "ae_session";

export interface User {
  email: string;
  passwordHash: string;
  createdAt: string;
  onboarded: boolean;
  plan: "free" | "pro" | "agency" | "developer";
  stripeCustomerId?: string;
  apiKey?: string;
  referralCode?: string;
  referredBy?: string;
  bonusCalls?: number;
  webhookUrl?: string;
}

/**
 * Hash a password using SHA-256 + salt (Web Crypto — zero deps)
 */
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const s = salt || crypto.randomUUID();
  const data = new TextEncoder().encode(s + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return { hash: `${s}:${hash}`, salt: s };
}

/**
 * Verify a password against a stored hash
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt] = storedHash.split(":");
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

/**
 * Create a new user account
 */
export async function createUser(email: string, password: string): Promise<User> {
  const existing = await store.getJSON<User>(`user:${email}`);
  if (existing) throw new Error("Account already exists");

  const { hash } = await hashPassword(password);
  const apiKey = `ae_${crypto.randomUUID().replace(/-/g, "")}`;

  const referralCode = `ref_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

  const user: User = {
    email,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
    onboarded: false,
    plan: "free",
    apiKey,
    referralCode,
    bonusCalls: 0,
  };

  await store.setJSON(`user:${email}`, user);
  await store.set(`apikey:${apiKey}`, email); // Reverse lookup for API auth
  await store.set(`refcode:${referralCode}`, email); // Reverse lookup for referrals
  return user;
}

/**
 * Authenticate with email + password
 */
export async function authenticateUser(email: string, password: string): Promise<User> {
  const user = await store.getJSON<User>(`user:${email}`);
  if (!user) throw new Error("Invalid email or password");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  return user;
}

/**
 * Update user data
 */
export async function updateUser(email: string, updates: Partial<User>): Promise<User> {
  const user = await store.getJSON<User>(`user:${email}`);
  if (!user) throw new Error("User not found");
  const updated = { ...user, ...updates };
  await store.setJSON(`user:${email}`, updated);
  return updated;
}

/**
 * Create a session and return the session ID
 */
export async function createSession(email: string): Promise<string> {
  const sessionId = `ae_sess_${crypto.randomUUID().replace(/-/g, "")}`;
  await store.set(`session:${sessionId}`, email, SESSION_TTL);
  return sessionId;
}

/**
 * Get the current user from the session cookie (server-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) return null;

    const email = await store.get(`session:${sessionId}`);
    if (!email) return null;

    const user = await store.getJSON<User>(`user:${email}`);
    return user;
  } catch {
    return null;
  }
}

/**
 * Auth via API key (for agents and programmatic access)
 */
export async function authenticateApiKey(apiKey: string): Promise<User | null> {
  const email = await store.get(`apikey:${apiKey}`);
  if (!email) return null;
  return await store.getJSON<User>(`user:${email}`);
}

/**
 * Require auth — checks session cookie OR API key header
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  // Check API key first (agent-friendly)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    const user = await authenticateApiKey(authHeader.replace("Bearer ", ""));
    if (user) return user;
  }

  // Fall back to session cookie
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) throw new Error("Not authenticated");

  const email = await store.get(`session:${sessionId}`);
  if (!email) throw new Error("Session expired");

  const user = await store.getJSON<User>(`user:${email}`);
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * Strip sensitive fields before sending to client
 */
export function safeUser(user: User) {
  const { passwordHash, ...safe } = user;
  void passwordHash;
  return safe;
}

export { SESSION_COOKIE };
