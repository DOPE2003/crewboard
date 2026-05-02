import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const job = await db.job.findUnique({
    where: { id },
    select: { id: true, title: true, company: true, budget: true, category: true, tags: true, description: true, status: true, ownerId: true },
  });

  if (!job || job.ownerId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(job);
}
