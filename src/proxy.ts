import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

// Use lightweight config — no Prisma, safe for Edge Runtime.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const profileComplete = req.auth?.user?.profileComplete ?? false;
  const humanVerified = req.auth?.user?.humanVerified ?? false;

  // 1. GLOBAL SITE PASSWORD PROTECTION
  const isPublicAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/locked') ||
    pathname.startsWith('/models') ||
    pathname.startsWith('/logo.png') ||
    pathname.startsWith('/favicon.ico');

  const hasAccessCookie = req.cookies.get('site-access')?.value === process.env.SITE_PASSWORD;

  if (!isPublicAsset && !hasAccessCookie && process.env.SITE_PASSWORD) {
    const url = req.nextUrl.clone();
    url.pathname = '/locked';
    return NextResponse.redirect(url);
  }

  // 2. AUTHENTICATION REDIRECTS
  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isVerify = pathname.startsWith("/verify");
  const isLogin = pathname.startsWith("/login");

  // Not logged in → login (for protected pages)
  if ((isDashboard || isOnboarding || isVerify) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in but not face-verified → /verify
  // Allow /verify, /login, /api, public pages through
  if (isLoggedIn && !humanVerified && !isVerify && !isLogin && !isPublicAsset) {
    const url = req.nextUrl.clone();
    url.pathname = "/verify";
    return NextResponse.redirect(url);
  }

  // Logged in, face-verified, profile incomplete → onboarding
  if (isLoggedIn && humanVerified && !profileComplete && isDashboard) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Logged in, face-verified, profile complete, on onboarding → dashboard
  if (isLoggedIn && humanVerified && profileComplete && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Already verified, redirect away from /verify
  if (isLoggedIn && humanVerified && isVerify) {
    const url = req.nextUrl.clone();
    url.pathname = profileComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Broad matcher to catch all pages for password protection
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
