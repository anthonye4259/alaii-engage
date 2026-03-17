import { NextRequest, NextResponse } from "next/server";

// Facebook OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=facebook_denied`);
  }

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

    // Get user profile
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${longLivedData.access_token || tokenData.access_token}`
    );
    const profile = await profileRes.json();

    // Get pages managed by user
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longLivedData.access_token || tokenData.access_token}`
    );
    const pagesData = await pagesRes.json();

    // TODO: Store token + pages in database
    console.log("✅ Facebook connected:", {
      userId: profile.id,
      name: profile.name,
      pages: pagesData.data?.map((p: { name: string }) => p.name) || [],
    });

    return NextResponse.redirect(`${appUrl}/accounts?connected=facebook`);
  } catch (err) {
    console.error("Facebook OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=facebook_failed`);
  }
}
