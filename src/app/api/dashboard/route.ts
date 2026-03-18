import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey } from "@/lib/auth";
import { getStats, getRecentActivity } from "@/lib/engagement-log";

/**
 * GET /api/dashboard — Get dashboard stats + activity feed
 * Auth: session cookie or Bearer token
 */
export async function GET(request: NextRequest) {
  let email: string | null = null;

  // Try API key
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    const user = await authenticateApiKey(authHeader.replace("Bearer ", ""));
    if (user) email = user.email;
  }

  // Fall back to cookie
  if (!email) {
    const user = await getCurrentUser();
    if (user) email = user.email;
  }

  if (!email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const [stats, activity] = await Promise.all([
    getStats(email),
    getRecentActivity(email, 10),
  ]);

  return NextResponse.json({ stats, activity });
}
