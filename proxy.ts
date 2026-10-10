import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every page except the login page, the auth API, Next.js internals and PWA files
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)"],
};