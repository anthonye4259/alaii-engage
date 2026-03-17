import { NextRequest, NextResponse } from "next/server";

// LinkedIn OAuth 2.0 - Step 2: Handle callback and exchange code for token
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("LinkedIn OAuth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/accounts?error=linkedin_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/accounts?error=no_code`
    );
  }

  // TODO: Verify state against stored session state

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error("Failed to get LinkedIn token:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/accounts?error=token_failed`
      );
    }

    // Get user profile
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    // TODO: Store token + profile in database
    console.log("✅ LinkedIn connected:", {
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
      sub: profile.sub,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/accounts?connected=linkedin`
    );
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/accounts?error=callback_failed`
    );
  }
}
