import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/admin", "/profile"];
const AUTH_ONLY = ["/login", "/register"];

export default auth(function proxy(req) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Redirect logged-in users away from auth-only pages
  if (session && AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Require login for protected routes
  if (!session && PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.next();

  // Set anonymous session cookie if not present (used for analytics + anon votes)
  if (!req.cookies.get("awb_sid")) {
    res.cookies.set("awb_sid", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 365,
      path:     "/",
    });
  }

  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
