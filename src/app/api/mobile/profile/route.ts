/**
 * GET /api/mobile/profile
 *
 * Returns the authenticated user's own profile plus their active gigs,
 * recent reviews, and aggregate stats.  Add `?handle=<handle>` to fetch
 * any public profile instead (no auth required for that).
 *
 * Headers  Authorization: Bearer <token>
 * 200      { data: { ...user, gigs, reviews, stats } }
 * 401      { error: "Unauthorized" }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, getMobileUser } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { computeFreelancerLevel } from "@/lib/freelancerLevel";

function withFallbackImage<T extends { image?: string | null; name?: string | null; twitterHandle?: string | null }>(user: T): T {
  if (user.image) return user;
  const seed = encodeURIComponent(user.name ?? user.twitterHandle ?? "?");
  return { ...user, image: `https://api.dicebear.com/9.x/initials/png?seed=${seed}&backgroundColor=14b8a6&fontColor=ffffff&size=200` };
}

function computeLevel(user: {
  bio?: string | null;
  image?: string | null;
  skills?: string[];
  walletAddress?: string | null;
  gigs: { id: string }[];
  reviewsReceived: { rating: number }[];
  _count: { sellerOrders: number };
}): number {
  const ratings = user.reviewsReceived.map((r) => r.rating);
  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;
  return computeFreelancerLevel({
    bio:             user.bio,
    image:           user.image,
    skills:          user.skills,
    walletAddress:   user.walletAddress,
    gigCount:        user.gigs.length,
    completedOrders: user._count.sellerOrders,
    avgRating,
  }).level;
}

const PUBLIC_SELECT = {
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
  instagramHandle: true,
  discordHandle: true,
  linkedinHandle: true,
  website: true,
  website2: true,
  website3: true,
  createdAt: true,
  gigs: {
    where: { status: "active" },
    select: { id: true, title: true, price: true, category: true, deliveryDays: true, tags: true, image: true },
    orderBy: { createdAt: "desc" as const },
  },
  reviewsReceived: {
    select: {
      id: true, rating: true, body: true, createdAt: true,
      reviewer: { select: { name: true, twitterHandle: true, image: true } },
    },
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
  _count: {
    select: {
      sellerOrders: { where: { status: "completed" } },
      reviewsReceived: true,
    },
  },
};

export async function GET(req: NextRequest) {
  const me = await getMobileUser(req);
  if (!me) return err("Unauthorized", 401);

  const handle     = req.nextUrl.searchParams.get("handle");
  const requestedId = req.nextUrl.searchParams.get("id");

  // ?handle= lookup (by twitter handle)
  if (handle) {
    const user = await db.user.findUnique({
      where: { twitterHandle: handle.toLowerCase() },
      select: PUBLIC_SELECT,
    });
    if (!user) return err("User not found.", 404);
    return ok({ ...withFallbackImage(user), level: computeLevel(user) });
  }

  // ?id= lookup — bearer token is only used for auth, not as identity
  const targetId = requestedId ?? me.sub;
  const isSelf   = targetId === me.sub;

  const user = await db.user.findUnique({
    where: { id: targetId },
    select: isSelf
      ? { ...PUBLIC_SELECT, email: true } // email only for own profile
      : PUBLIC_SELECT,
  });
  if (!user) return err("User not found.", 404);
  return ok({ ...withFallbackImage(user), level: computeLevel(user) });
}
