import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // If Supabase sends errors like ?error=...&error_description=...
  const errorDesc = url.searchParams.get("error_description");

  if (errorDesc) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDesc)}`, url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url));
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session?.user) {
    const msg = error?.message ?? "exchange_failed";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, url));
  }

  // Safe fallback: ensure profiles row exists (even if you add DB trigger later).
  const user = data.session.user;
  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  return NextResponse.redirect(new URL("/dashboard", url));
}