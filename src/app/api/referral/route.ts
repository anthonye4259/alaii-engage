import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey, updateUser } from "@/lib/auth";
import * as store from "@/lib/store";
import type { User } from "@/lib/auth";

const REFERRAL_BONUS = 100; // 100 bonus API calls for both referrer and referee

/**
 * GET — Get your referral link and stats
 * POST — Apply a referral code (on signup)
 */
export async function GET(request: NextRequest) {
  let user: User | null = null;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    user = await authenticateApiKey(authHeader.replace("Bearer ", ""));
  }
  if (!user) user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const referralUrl = `https://alaii-engage.vercel.app/login?signup=true&ref=${user.referralCode}`;

  // Count successful referrals
  const referrals = await store.getCount(`referrals:${user.email}`);

  return NextResponse.json({
    referralCode: user.referralCode,
    referralUrl,
    totalReferrals: referrals,
    bonusCallsEarned: referrals * REFERRAL_BONUS,
    currentBonusCalls: user.bonusCalls || 0,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { referralCode, email } = await request.json();

    if (!referralCode || !email) {
      return NextResponse.json({ error: "referralCode and email required" }, { status: 400 });
    }

    // Find the referrer
    // We need to scan for the referral code — store a reverse lookup
    const referrerEmail = await store.get(`refcode:${referralCode}`);
    if (!referrerEmail) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    if (referrerEmail === email) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Credit the referee
    const referee = await store.getJSON<User>(`user:${email}`);
    if (referee) {
      await updateUser(email, {
        referredBy: referrerEmail,
        bonusCalls: (referee.bonusCalls || 0) + REFERRAL_BONUS,
      });
    }

    // Credit the referrer
    const referrer = await store.getJSON<User>(`user:${referrerEmail}`);
    if (referrer) {
      await updateUser(referrerEmail, {
        bonusCalls: (referrer.bonusCalls || 0) + REFERRAL_BONUS,
      });
    }

    // Increment referral counter
    await store.increment(`referrals:${referrerEmail}`);

    return NextResponse.json({
      success: true,
      bonusGranted: REFERRAL_BONUS,
      message: `Both you and your referrer got ${REFERRAL_BONUS} bonus API calls!`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
