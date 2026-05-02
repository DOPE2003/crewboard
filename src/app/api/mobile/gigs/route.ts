import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const gigs = await db.gig.findMany({
    where: { status: "active" },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      deliveryDays: true,
      category: true,
      tags: true,
      status: true,
      image: true,
      createdAt: true,
      user: {
        select: { name: true, twitterHandle: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(gigs);
}
