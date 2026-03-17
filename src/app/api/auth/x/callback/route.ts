import { NextRequest, NextResponse } from "next/server";

// X (Twitter) OAuth 2.0 callback
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=x_denied`);
  }

  try {
    const basicAuth = Buffer.from(
      `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/auth/x/callback`,
        code_verifier: process.env.X_PKCE_VERIFIER || "alaii_engage_pkce_verifier",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/accounts?error=x_token_failed`);
    }

    // Get user profile
    const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url,public_metrics", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // TODO: Store token + user in database
    console.log("✅ X connected:", {
      userId: userData.data?.id,
      username: userData.data?.username,
      followers: userData.data?.public_metrics?.followers_count,
    });

    return NextResponse.redirect(`${appUrl}/accounts?connected=x`);
  } catch (err) {
    console.error("X OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=x_failed`);
  }
}
