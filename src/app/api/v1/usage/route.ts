import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/auth";
import { getUsage } from "@/lib/metering";

/**
 * GET /api/v1/usage — Check your API usage and costs
 *
 * Auth: Bearer token (API key)
 *
 * Response: {
 *   callsThisPeriod: number,
 *   estimatedCost: number,
 *   periodStart: string,
 *   periodEnd: string,
 *   ratePerCall: 0.01
 * }
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ae_")) {
    return NextResponse.json(
      { error: "Missing or invalid API key" },
      { status: 401 }
    );
  }

  const apiKey = authHeader.replace("Bearer ", "");
  const user = await authenticateApiKey(apiKey);
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  const usage = await getUsage(apiKey);
  return NextResponse.json(usage);
}
