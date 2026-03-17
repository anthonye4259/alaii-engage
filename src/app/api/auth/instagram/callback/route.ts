import { NextRequest, NextResponse } from "next/server";

// Instagram OAuth callback — exchange code for token, get IG business account
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=instagram_denied`);
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

    // Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedData.access_token || tokenData.access_token}`
    );
    const pagesData = await pagesRes.json();

    // Get Instagram Business Account from first page
    if (pagesData.data?.[0]) {
      const pageId = pagesData.data[0].id;
      const pageToken = pagesData.data[0].access_token;

      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      );
      const igData = await igRes.json();

      // TODO: Store token + IG account in database
      console.log("✅ Instagram connected:", {
        igAccountId: igData.instagram_business_account?.id,
        pageId,
        pageToken: pageToken.slice(0, 20) + "...",
      });
    }

    return NextResponse.redirect(`${appUrl}/accounts?connected=instagram`);
  } catch (err) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=instagram_failed`);
  }
}
