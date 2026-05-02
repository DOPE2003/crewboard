import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const gig = await db.gig.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true, price: true,
      deliveryDays: true, category: true, tags: true, status: true, image: true,
    },
  });
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(gig);
}
