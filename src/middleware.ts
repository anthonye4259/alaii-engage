import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // Allow embedding in iframes
  response.headers.set(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.alaii.com https://alaii.com https://*.vercel.app https://localhost:*"
  );
  response.headers.delete("X-Frame-Options");

  // Handle postMessage communication with parent window
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
