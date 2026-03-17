import { NextRequest, NextResponse } from "next/server";

// TikTok OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=tiktok_denied`);
  }

  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/auth/tiktok/callback`,
        code_verifier: process.env.TIKTOK_PKCE_VERIFIER || "alaii_engage_tiktok_pkce_verifier",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.data?.access_token) {
      return NextResponse.redirect(`${appUrl}/accounts?error=tiktok_token_failed`);
    }

    // Get user info
    const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name", {
      headers: { Authorization: `Bearer ${tokenData.data.access_token}` },
    });
    const userData = await userRes.json();

    // TODO: Store token + user in database
    console.log("✅ TikTok connected:", {
      openId: tokenData.data.open_id,
      displayName: userData.data?.user?.display_name,
      accessToken: tokenData.data.access_token.slice(0, 20) + "...",
    });

    return NextResponse.redirect(`${appUrl}/accounts?connected=tiktok`);
  } catch (err) {
    console.error("TikTok OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=tiktok_failed`);
  }
}
