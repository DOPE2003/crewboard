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
  discordHandle: true,
  linkedinHandle: true,
  website: true,
  website2: true,
  website3: true,
  createdAt: true,
  gigs: {
    where: { status: "active" },
    select: { id: true, title: true, price: true, category: true, deliveryDays: true, tags: true },
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
  // Public profile lookup: ?handle=<twitterHandle>
  const handle = req.nextUrl.searchParams.get("handle");
  if (handle) {
    const user = await db.user.findUnique({
      where: { twitterHandle: handle.toLowerCase() },
      select: PUBLIC_SELECT,
    });
    if (!user) return err("User not found.", 404);
    return ok(user);
  }

  // Own profile — requires auth
  const me = await getMobileUser(req);
  if (!me) return err("Unauthorized", 401);

  const user = await db.user.findUnique({
    where: { id: me.sub },
    select: {
      ...PUBLIC_SELECT,
      email: true, // private field, only visible to self
    },
  });
  if (!user) return err("User not found.", 404);
  return ok(user);
}
