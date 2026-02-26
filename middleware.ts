import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};