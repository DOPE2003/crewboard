import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ unread: 0 });

  const unread = await db.notification.count({
    where: { userId, read: false },
  }).catch(() => 0);

  return NextResponse.json({ unread });
}
