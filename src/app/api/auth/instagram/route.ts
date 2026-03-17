import { NextResponse } from "next/server";

// Instagram OAuth — Uses Meta Graph API (same as Facebook)
// Requires: instagram_basic, instagram_manage_comments, pages_show_list
export async function GET() {
  const clientId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/auth/instagram/callback`;

  const scopes = [
    "instagram_basic",
    "instagram_manage_comments",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  const state = crypto.randomUUID();

  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
