import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveConnectedAccount, registerActiveUser } from "@/lib/connected-accounts";

// Instagram OAuth callback — exchange code for token, store per user
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=instagram_denied`);
  }

  // Get the current user from session
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(`${appUrl}/api/auth/instagram/callback`)}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/accounts?error=instagram_token_failed`);
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

    // Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    let handle = "";
    let platformUserId = "";
    let pageToken = "";

    // Get Instagram Business Account from first page
    if (pagesData.data?.[0]) {
      const pageId = pagesData.data[0].id;
      pageToken = pagesData.data[0].access_token;

      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      );
      const igData = await igRes.json();
      platformUserId = igData.instagram_business_account?.id || "";

      // Get IG username
      if (platformUserId) {
        const profileRes = await fetch(
          `https://graph.facebook.com/v21.0/${platformUserId}?fields=username&access_token=${pageToken}`
        );
        const profileData = await profileRes.json();
        handle = profileData.username || "";
      }
    }

    // Save to Redis per-user
    await saveConnectedAccount(user.email, {
      platform: "instagram",
      handle: handle || "connected",
      accessToken,
      pageToken,
      platformUserId,
      connectedAt: new Date().toISOString(),
    });
    await registerActiveUser(user.email);

    return NextResponse.redirect(`${appUrl}/accounts?connected=instagram`);
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=instagram_failed`);
  }
}
