import { NextResponse } from "next/server";

// Reddit OAuth 2.0
export async function GET() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/auth/reddit/callback`;

  const scopes = [
    "identity",
    "read",
    "submit",
    "edit",
    "privatemessages",
    "vote",
  ].join(" ");

  const state = crypto.randomUUID();

  const authUrl = new URL("https://www.reddit.com/api/v1/authorize");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("duration", "permanent");
  authUrl.searchParams.set("scope", scopes);

  return NextResponse.redirect(authUrl.toString());
}
