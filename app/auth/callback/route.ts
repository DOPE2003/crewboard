import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
