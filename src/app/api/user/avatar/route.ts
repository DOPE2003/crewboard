import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  await db.user.update({ where: { id: userId }, data: { image: url } });
  return NextResponse.json({ ok: true });
}
