import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey } from "@/lib/auth";
import { getInsights, type PerformanceInsights } from "@/lib/performance-learning";

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    return authenticateApiKey(authHeader.replace("Bearer ", ""));
  }
  return getCurrentUser();
}

/**
 * GET /api/v1/analytics — Get performance learning insights
 */
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const insights = await getInsights(user.email);
  return NextResponse.json(insights);
}
