import { NextRequest, NextResponse } from "next/server";
import { createMagicToken, sendMagicLink } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const token = await createMagicToken(email.toLowerCase().trim());
    await sendMagicLink(email.toLowerCase().trim(), token);

    return NextResponse.json({ success: true, message: "Magic link sent" });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}
