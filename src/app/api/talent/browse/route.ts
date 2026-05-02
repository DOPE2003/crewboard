import { NextResponse } from "next/server";
import db from "@/lib/db";

// Cache this response for 2 minutes — talent list doesn't need to be real-time
export const revalidate = 120;

export async function GET() {
  const users = await db.user.findMany({
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
      _count: { select: { gigs: true } },
      gigs: {
        where: { status: "active" },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const result = users
    .map(({ walletAddress: _w, _count: _c, gigs, portfolioItems, reviewsReceived, ...rest }) => {
      const reviewsCount = reviewsReceived.length;
      const rating = reviewsCount > 0
        ? Math.round((reviewsReceived.reduce((a, r) => a + r.rating, 0) / reviewsCount) * 10) / 10
        : 0;
      const items = Array.isArray(portfolioItems) ? portfolioItems as any[] : [];
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
      return { ...rest, rating, reviewsCount, minPrice: gigs[0]?.price ?? null, media };
    })
    .slice(0, 50);

  return NextResponse.json(result);
}
