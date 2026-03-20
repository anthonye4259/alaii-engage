import { NextResponse } from "next/server";

// Facebook OAuth — Uses Meta Graph API
export async function GET() {
  const clientId = process.env.META_APP_ID;
  if (!clientId) return NextResponse.json({ error: "Facebook connection not configured. Set META_APP_ID." }, { status: 503 });
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/auth/facebook/callback`;

  const scopes = [
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_engagement",
    "pages_manage_posts",
    "public_profile",
    "email",
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
