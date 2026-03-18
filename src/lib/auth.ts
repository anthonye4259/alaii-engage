/**
 * Auth — Magic link authentication with Redis sessions
 *
 * Flow: email → magic link → verify token → create session cookie
 * Sessions stored in Upstash Redis with 30-day TTL.
 */

import * as store from "./store";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_TTL = 30 * 24 * 3600; // 30 days
const MAGIC_TOKEN_TTL = 600;         // 10 minutes
const SESSION_COOKIE = "ae_session";

export interface User {
  email: string;
  createdAt: string;
  onboarded: boolean;           // Completed onboarding wizard?
  plan: "free" | "pro" | "agency" | "developer";
  stripeCustomerId?: string;
}

/**
 * Generate a magic link token and store in Redis
 */
export async function createMagicToken(email: string): Promise<string> {
  const token = `ae_magic_${crypto.randomUUID().replace(/-/g, "")}`;
  await store.setJSON(`magic:${token}`, { email, createdAt: new Date().toISOString() }, MAGIC_TOKEN_TTL);
  return token;
}

/**
 * Verify a magic link token and return the email
 */
export async function verifyMagicToken(token: string): Promise<string | null> {
  const data = await store.getJSON<{ email: string }>(`magic:${token}`);
  if (!data) return null;
  // Delete token after use (one-time)
  await store.del(`magic:${token}`);
  return data.email;
}

/**
 * Create or get a user record
 */
export async function getOrCreateUser(email: string): Promise<User> {
  const existing = await store.getJSON<User>(`user:${email}`);
  if (existing) return existing;

  const user: User = {
    email,
    createdAt: new Date().toISOString(),
    onboarded: false,
    plan: "free",
  };
  await store.setJSON(`user:${email}`, user, SESSION_TTL);
  return user;
}

/**
 * Update user data
 */
export async function updateUser(email: string, updates: Partial<User>): Promise<User> {
  const user = await getOrCreateUser(email);
  const updated = { ...user, ...updates };
  await store.setJSON(`user:${email}`, updated, SESSION_TTL);
  return updated;
}

/**
 * Create a session and set the cookie
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

    return await getOrCreateUser(email);
  } catch {
    return null;
  }
}

/**
 * Require auth — throws if not authenticated (for API routes)
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) throw new Error("Not authenticated");

  const email = await store.get(`session:${sessionId}`);
  if (!email) throw new Error("Session expired");

  return await getOrCreateUser(email);
}

/**
 * Send a magic link email via Resend
 */
export async function sendMagicLink(email: string, token: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Alaii Engage <noreply@alaii.app>",
      to: [email],
      subject: "Sign in to Alaii Engage",
      html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #1E293B; margin: 0;">Alaii Engage</h1>
            <p style="font-size: 14px; color: #64748B; margin-top: 4px;">AI-Powered Social Engagement</p>
          </div>
          <p style="font-size: 15px; color: #1E293B; line-height: 1.6;">Click the button below to sign in. This link expires in 10 minutes.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #4A9FD4, #5AC8FA); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 600;">
              Sign in to Alaii Engage →
            </a>
          </div>
          <p style="font-size: 12px; color: #94A3B8; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });
}

export { SESSION_COOKIE };
