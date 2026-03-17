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

  // For PKCE with "plain" method, code_challenge === code_verifier
  // In production, store this in a session/cookie so the callback can retrieve it
  // For now, use a deterministic value derived from state that both sides can reconstruct
  const codeChallenge = process.env.X_PKCE_VERIFIER || "alaii_engage_pkce_verifier";

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

