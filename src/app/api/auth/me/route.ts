import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey, safeUser, updateUser } from "@/lib/auth";

/**
 * GET /api/auth/me — Get current user
 * Supports: session cookie (browser) OR Bearer token (agent)
 */
export async function GET(request: NextRequest) {
  // Try API key first (agent-friendly)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    const user = await authenticateApiKey(authHeader.replace("Bearer ", ""));
    if (user) {
      return NextResponse.json({ authenticated: true, user: safeUser(user) });
    }
  }

  // Fall back to session cookie (browser)
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: safeUser(user) });
}

/**
 * PATCH /api/auth/me — Update user data (onboarding, business context)
 */
export async function PATCH(request: NextRequest) {
  // Try API key
  const authHeader = request.headers.get("Authorization");
  let user = null;

  if (authHeader?.startsWith("Bearer ae_")) {
    user = await authenticateApiKey(authHeader.replace("Bearer ", ""));
  }

  // Fall back to cookie
  if (!user) {
    user = await getCurrentUser();
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const updated = await updateUser(user.email, updates);
    return NextResponse.json({ success: true, user: safeUser(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
