import { NextResponse } from "next/server";

// X (Twitter) OAuth 2.0 with PKCE
export async function GET() {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/auth/x/callback`;

  const scopes = [
    "tweet.read",
    "tweet.write",
    "users.read",
    "like.read",
    "like.write",
    "follows.read",
    "offline.access",
  ].join(" ");

  const state = crypto.randomUUID();
  const codeChallenge = crypto.randomUUID().replace(/-/g, "");

  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "plain");

  return NextResponse.redirect(authUrl.toString());
}
