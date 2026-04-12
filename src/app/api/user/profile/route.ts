import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

// PATCH /api/user/profile — update notification email
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email) {
    // Allow clearing the email
    await db.user.update({ where: { id: userId }, data: { email: null } });
    return NextResponse.json({ ok: true });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    await db.user.update({ where: { id: userId }, data: { email } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "This email is already linked to another account" }, { status: 409 });
    }
    console.error("[PATCH /api/user/profile]", err);
    return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
  }
}
