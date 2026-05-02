import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse, NextRequest } from "next/server";

// Use lightweight config — no Prisma, safe for Edge Runtime.
const { auth } = NextAuth(authConfig);

// Auth-wrapped handler for normal page/navigation requests.
const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const profileComplete = req.auth?.user?.profileComplete ?? false;

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
  const isLogin = pathname.startsWith("/login");

  // Not logged in → login (for protected pages)
  if ((isDashboard || isOnboarding) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in, profile incomplete → onboarding
  if (isLoggedIn && !profileComplete && isDashboard) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Logged in, profile complete, on onboarding → dashboard
  if (isLoggedIn && profileComplete && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Already logged in and lands on /login or /register → send to dashboard/onboarding
  const isRegister = pathname.startsWith("/register");
  if (isLoggedIn && (isLogin || isRegister)) {
    const url = req.nextUrl.clone();
    url.pathname = profileComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

// Main middleware export — server action POST requests (Next-Action header) bypass
// the NextAuth wrapper entirely so it cannot intercept/corrupt the request body.
export default function middleware(req: NextRequest) {
  if (req.headers.get("Next-Action")) {
    return NextResponse.next();
  }
  return (authMiddleware as any)(req);
}

export const config = {
  // Broad matcher to catch all pages for password protection
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)'],
};
