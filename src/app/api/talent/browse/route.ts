import { NextResponse } from "next/server";
import db from "@/lib/db";
import { computeProfileScore, PROFILE_SCORE_THRESHOLD } from "@/lib/profileScore";

// Cache this response for 2 minutes — talent list doesn't need to be real-time
export const revalidate = 120;

export async function GET() {
  const users = await db.user.findMany({
    where: { profileComplete: true },
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

  // Filter by profile completion score
  const qualified = users
    .filter((u) =>
      computeProfileScore({
        bio: u.bio,
        image: u.image,
        skills: u.skills,
        gigCount: u._count.gigs,
        walletAddress: u.walletAddress,
      }).meetsThreshold
    )
    .map(({ walletAddress: _w, _count: _c, gigs, portfolioItems, ...rest }) => {
      // Extract only image/video mediaUrls from portfolioItems for the card swiper
      const items = Array.isArray(portfolioItems) ? portfolioItems as any[] : [];
      const media = items
        .filter((i) => !!i.mediaUrl)
        .slice(0, 5)
        .map((i) => {
          const url: string = i.mediaUrl ?? "";
          // Resolve mediaType — same logic as the profile page
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
      return { ...rest, minPrice: gigs[0]?.price ?? null, media };
    })
    .slice(0, 50);

  return NextResponse.json(qualified);
}
