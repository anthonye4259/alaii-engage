import { NextResponse } from "next/server";
import { getCurrentUser, safeUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: safeUser(user) });
}
