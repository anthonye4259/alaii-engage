import { NextRequest, NextResponse } from "next/server";

// LinkedIn OAuth 2.0 - Step 1: Redirect to LinkedIn authorization
export async function GET(req: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "LinkedIn connection not configured. Set LINKEDIN_CLIENT_ID." }, { status: 503 });
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/auth/linkedin/callback`;

  // Scopes needed for engagement: post, comment, like, share
  const scopes = [
    "openid",
    "profile",
    "email",
    "w_member_social", // Post, comment, like, share as member
  ].join(" ");

  const state = crypto.randomUUID(); // CSRF protection

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);

  // TODO: Store state in session/cookie for verification

  return NextResponse.redirect(authUrl.toString());
}
