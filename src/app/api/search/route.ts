import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ users: [], gigs: [] });

  const [users, gigs] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { twitterHandle: { contains: q, mode: "insensitive" } },
          { userTitle: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        twitterHandle: true,
        image: true,
        userTitle: true,
        availability: true,
      },
      take: 5,
    }),
    db.gig.findMany({
      where: {
        status: "active",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        deliveryDays: true,
        user: {
          select: { name: true, twitterHandle: true, image: true },
        },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ users, gigs });
}
