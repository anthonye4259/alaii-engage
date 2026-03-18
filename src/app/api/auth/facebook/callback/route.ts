import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveConnectedAccount, registerActiveUser } from "@/lib/connected-accounts";

// Facebook OAuth callback — exchange code for token, store per user
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=facebook_denied`);
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(`${appUrl}/api/auth/facebook/callback`)}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/accounts?error=facebook_token_failed`);
    }

    // Get long-lived token
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();
    const accessToken = longLivedData.access_token || tokenData.access_token;

    // Get user profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${accessToken}`
    );
    const profile = await profileRes.json();

    // Get pages managed by user
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    const firstPage = pagesData.data?.[0];

    await saveConnectedAccount(user.email, {
      platform: "facebook",
      handle: profile.name || "connected",
      accessToken,
      platformUserId: profile.id,
      connectedAt: new Date().toISOString(),
      metadata: {
        pageId: firstPage?.id || "",
        pageToken: firstPage?.access_token || "",
        pageName: firstPage?.name || "",
      },
    });
    await registerActiveUser(user.email);

    return NextResponse.redirect(`${appUrl}/accounts?connected=facebook`);
  } catch (err) {
    console.error("Facebook OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=facebook_failed`);
  }
}
