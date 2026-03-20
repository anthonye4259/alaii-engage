import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authenticateApiKey, updateUser } from "@/lib/auth";
import type { User } from "@/lib/auth";

/**
 * GET — Get current webhook URL
 * POST — Register/update webhook URL
 * DELETE — Remove webhook
 *
 * Webhooks fire on every engagement event:
 * { event: "engagement.completed", platform, action, target, content, timestamp }
 */
export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  return NextResponse.json({
    webhookUrl: user.webhookUrl || null,
    events: ["engagement.completed"],
    example: {
      event: "engagement.completed",
      platform: "instagram",
      action: "comment_reply",
      target: "@user's post",
      content: "great work! 🔥",
      timestamp: new Date().toISOString(),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  try {
    const { url } = await request.json();

    if (!url || !url.startsWith("https://")) {
      return NextResponse.json({ error: "Valid HTTPS URL required" }, { status: 400 });
    }

    await updateUser(user.email, { webhookUrl: url });

    return NextResponse.json({
      success: true,
      webhookUrl: url,
      message: "Webhook registered. You'll receive POST requests on every engagement.",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.plan === "free") return NextResponse.json({ error: "Subscription required.", upgrade: "https://alaii-engage.vercel.app/pricing" }, { status: 403 });

  await updateUser(user.email, { webhookUrl: undefined });
  return NextResponse.json({ success: true, message: "Webhook removed" });
}

async function getUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ae_")) {
    return await authenticateApiKey(authHeader.replace("Bearer ", ""));
  }
  return await getCurrentUser();
}
