import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  await db.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
