import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { computeFreelancerLevel } from "@/lib/freelancerLevel";

// Cache this response for 2 minutes — talent list doesn't need to be real-time
export const revalidate = 120;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? req.nextUrl.searchParams.get("search")?.trim() ?? "";

  const where = q
    ? {
        OR: [
          { name:          { contains: q, mode: "insensitive" as const } },
          { twitterHandle: { contains: q, mode: "insensitive" as const } },
          { userTitle:     { contains: q, mode: "insensitive" as const } },
          { bio:           { contains: q, mode: "insensitive" as const } },
          { skills:        { has: q } },
        ],
      }
    : {};

  const users = await db.user.findMany({
    where,
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
      portfolioItems: true,
      reviewsReceived: { select: { rating: true } },
      _count: {
        select: {
          gigs: true,
          sellerOrders: { where: { status: "completed" } },
        },
      },
      gigs: {
        where: { status: "active" },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    take: q ? 100 : 500,
  });

  const withLevels = users.map((user) => {
    const { walletAddress, _count, gigs, portfolioItems, reviewsReceived, bio, image, skills, ...rest } = user;

    const reviewsCount = reviewsReceived.length;
    const avgRating = reviewsCount > 0
      ? Math.round((reviewsReceived.reduce((a, r) => a + r.rating, 0) / reviewsCount) * 10) / 10
      : null;

    const gigCount = _count.gigs;
    const completedOrders = _count.sellerOrders;

    const { level, points } = computeFreelancerLevel({
      bio,
      image,
      skills,
      walletAddress,
      gigCount,
      completedOrders,
      avgRating,
    });

    const items = Array.isArray(portfolioItems) ? (portfolioItems as any[]) : [];
    const media = items
      .filter((i) => !!i.mediaUrl)
      .slice(0, 5)
      .map((i) => {
        const url: string = i.mediaUrl ?? "";
        const resolvedType: string = i.mediaType ?? i.type ?? (
          url.match(/\.(mp4|webm|mov)$/i) ? "video" :
          url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? "image" :
          url.startsWith("data:video") ? "video" :
          url.startsWith("data:image") ? "image" :
          "image"
        );
        return { mediaUrl: url, mediaType: resolvedType, title: (i.title as string) ?? "" };
      })
      .filter((i) => i.mediaType === "image" || i.mediaType === "video");

    return {
      ...rest,
      bio,
      image,
      skills,
      rating: avgRating ?? 0,
      reviewsCount,
      minPrice: gigs[0]?.price ?? null,
      media,
      level,
      points,
    };
  });

  // Highest level first, then highest points within the same level
  withLevels.sort((a, b) =>
    b.level !== a.level ? b.level - a.level : b.points - a.points
  );

  return NextResponse.json(withLevels.slice(0, 200));
}
