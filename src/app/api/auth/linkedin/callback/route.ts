import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveConnectedAccount, registerActiveUser } from "@/lib/connected-accounts";

// LinkedIn OAuth 2.0 - Step 2: Handle callback and exchange code for token
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").trim();

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=linkedin_denied`);
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${appUrl}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${appUrl}/accounts?error=linkedin_token_failed`);
    }

    // Get user profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    await saveConnectedAccount(user.email, {
      platform: "linkedin",
      handle: profile.name || profile.email || "connected",
      accessToken: tokenData.access_token,
      platformUserId: profile.sub,
      connectedAt: new Date().toISOString(),
    });
    await registerActiveUser(user.email);

    return NextResponse.redirect(`${appUrl}/accounts?connected=linkedin`);
  } catch (err) {
    console.error("LinkedIn OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=linkedin_failed`);
  }
}
