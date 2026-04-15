import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/mobile/profile?id=<userId>
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("id");
  if (!userId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      twitterHandle: true,
      image: true,
      userTitle: true,
      bio: true,
      skills: true,
      availability: true,
      walletAddress: true,
      profileComplete: true,
      isOG: true,
      humanVerified: true,
      bannerImage: true,
      portfolioItems: true,
      twitterHandle2: true,
      telegramHandle: true,
      githubHandle: true,
      discordHandle: true,
      linkedinHandle: true,
      website: true,
      website2: true,
      website3: true,
      email: true,
      createdAt: true,
      gigs: {
        where: { status: "active" },
        select: {
          id: true,
          title: true,
          price: true,
          category: true,
          deliveryDays: true,
          tags: true,
        },
        orderBy: { createdAt: "desc" },
      },
      reviewsReceived: {
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          reviewer: {
            select: { name: true, twitterHandle: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          sellerOrders: { where: { status: "completed" } },
          reviewsReceived: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(user);
}
