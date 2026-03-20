import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveConnectedAccount, registerActiveUser } from "@/lib/connected-accounts";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001").trim();

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=reddit_denied`);
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

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

    const userRes = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "AlaiEngage/1.0" },
    });
    const userData = await userRes.json();

    await saveConnectedAccount(user.email, {
      platform: "reddit",
      handle: userData.name || "connected",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      platformUserId: userData.name,
      connectedAt: new Date().toISOString(),
    });
    await registerActiveUser(user.email);

    return NextResponse.redirect(`${appUrl}/accounts?connected=reddit`);
  } catch (err) {
    console.error("Reddit OAuth error:", err);
    return NextResponse.redirect(`${appUrl}/accounts?error=reddit_failed`);
  }
}
