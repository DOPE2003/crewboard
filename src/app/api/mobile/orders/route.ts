import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/mobile/orders?userId=<userId>
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const orders = await db.order.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: {
      id: true,
      amount: true,
      status: true,
      escrowAddress: true,
      txHash: true,
      createdAt: true,
      updatedAt: true,
      gig: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      buyer: {
        select: { id: true, name: true, twitterHandle: true, image: true },
      },
      seller: {
        select: { id: true, name: true, twitterHandle: true, image: true },
      },
      reviews: {
        select: { id: true, rating: true, body: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders);
}
