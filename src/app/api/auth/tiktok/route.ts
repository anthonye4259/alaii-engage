import { NextResponse } from "next/server";

// TikTok OAuth — Uses TikTok Login Kit
export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY?.trim();
  if (!clientKey) return NextResponse.json({ error: "TikTok connection not configured. Set TIKTOK_CLIENT_KEY." }, { status: 503 });
  const redirectUri = `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").trim()}/api/auth/tiktok/callback`;

  const scopes = [
    "user.info.basic",
    "video.list",
    "comment.list",
    "comment.list.manage",
  ].join(",");

  const state = crypto.randomUUID();

  // PKCE: use plain method so both auth and callback can use the same verifier
  // In production, store in session/cookie for proper S256 flow
  const codeChallenge = process.env.TIKTOK_PKCE_VERIFIER || "alaii_engage_tiktok_pkce_verifier";

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", clientKey!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "plain");

  return NextResponse.redirect(authUrl.toString());
}

