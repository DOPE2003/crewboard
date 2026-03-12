import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow access to static assets, images, and the locked page itself
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/locked') ||
    pathname.startsWith('/logo.png') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Check for the access cookie
  const isAuthorized = request.cookies.get('site-access')?.value === process.env.SITE_PASSWORD;

  // 3. Redirect to /locked if not authorized
  if (!isAuthorized && process.env.SITE_PASSWORD) {
    const url = request.nextUrl.clone();
    url.pathname = '/locked';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
