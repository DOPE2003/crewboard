import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const gig = await db.gig.findUnique({ where: { id }, select: { userId: true } });
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gig.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await db.gig.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const gig = await db.gig.findUnique({ where: { id }, select: { userId: true } });
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (gig.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.gig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
