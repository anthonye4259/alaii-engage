import { NextRequest, NextResponse } from "next/server";
import { createUser, safeUser, createSession, SESSION_COOKIE } from "@/lib/auth";

/**
 * POST /api/auth/signup — Create a new account
 * Agent-friendly: returns API key on success
 *
 * Body: { email, password }
 * Response: { success, user: { email, apiKey, plan, ... } }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await createUser(email.toLowerCase().trim(), password);
    const sessionId = await createSession(user.email);

    const response = NextResponse.json({
      success: true,
      user: safeUser(user),
    });

    // Set session cookie for browser clients
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 3600,
      path: "/",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
