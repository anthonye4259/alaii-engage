import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConnectedAccounts, disconnectAccount } from "@/lib/connected-accounts";

/**
 * GET /api/accounts — Get user's connected accounts
 * DELETE /api/accounts — Disconnect a platform
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const accounts = await getConnectedAccounts(user.email);

  // Strip sensitive data (tokens) before sending to client
  const safe = accounts.map((a) => ({
    platform: a.platform,
    handle: a.handle,
    connectedAt: a.connectedAt,
    platformUserId: a.platformUserId,
  }));

  return NextResponse.json({ accounts: safe });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { platform } = await request.json();
  if (!platform) return NextResponse.json({ error: "Platform required" }, { status: 400 });

  await disconnectAccount(user.email, platform);
  return NextResponse.json({ success: true });
}
