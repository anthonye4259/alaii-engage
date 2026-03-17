import { NextRequest, NextResponse } from "next/server";

// Reddit OAuth callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=reddit_denied`);
  }

  try {
    const basicAuth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
        "User-Agent": "AlaiEngage/1.0",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appUrl}/api/auth/reddit/callback`,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/accounts?error=reddit_token_failed`);
    }

    // Get user profile
    const userRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "AlaiEngage/1.0",
      },
    });
    const userData = await userRes.json();

    // TODO: Store token + user in database
    console.log("✅ Reddit connected:", {
      username: userData.name,
      karma: userData.total_karma,
      refreshToken: tokenData.refresh_token?.slice(0, 20) + "...",
    });

    return NextResponse.redirect(`${appUrl}/accounts?connected=reddit`);
  } catch (err) {
    console.error("Reddit OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=reddit_failed`);
  }
}
