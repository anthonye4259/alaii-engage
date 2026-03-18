import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken, getOrCreateUser, createSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  const email = await verifyMagicToken(token);
  if (!email) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  // Get or create user + create session
  const user = await getOrCreateUser(email);
  const sessionId = await createSession(email);

  // Redirect based on onboarding status
  const redirectUrl = user.onboarded ? "/" : "/onboarding";
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));

  // Set session cookie (30 days, httpOnly, secure in prod)
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 3600,
    path: "/",
  });

  return response;
}
