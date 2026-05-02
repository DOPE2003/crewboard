/**
 * GET /api/mobile/talent/browse
 *
 * Paginated freelancer listing for the iOS home/browse screen.
 *
 * Query params:
 *   page    number (1-based, default 1)
 *   limit   number (max 50, default 20)
 *   search  string (name / handle / bio contains)
 *
 * Response per item:
 *   id, name, twitterHandle, image, role (userTitle), rating, reviewsCount,
 *   chain, isOnline,
 *   joinedAt        — ISO 8601 (User.createdAt)
 *   profileComplete — boolean
 *   skills          — string[]
 *
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

function fallbackImage(name?: string | null, handle?: string | null) {
  const seed = encodeURIComponent(name ?? handle ?? "?");
  return `https://api.dicebear.com/9.x/initials/png?seed=${seed}&backgroundColor=14b8a6&fontColor=ffffff&size=200`;
}

// Infer chain from wallet address: ETH starts with 0x, else treat as SOL
function inferChain(wallet?: string | null): string {
  if (!wallet) return "SOL";
  return wallet.startsWith("0x") ? "ETH" : "SOL";
}

async function handler(req: NextRequest, _user: MobileTokenPayload) {
  try {
    const sp     = req.nextUrl.searchParams;
    const page   = Math.max(1, parseInt(sp.get("page")  ?? "1",  10));
    const limit  = Math.min(50, parseInt(sp.get("limit") ?? "20", 10));
    const search = sp.get("search")?.trim() ?? "";

    const where = search
      ? {
          OR: [
            { name:          { contains: search, mode: "insensitive" as const } },
            { twitterHandle: { contains: search, mode: "insensitive" as const } },
            { bio:           { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id:              true,
          name:            true,
          twitterHandle:   true,
          image:           true,
          userTitle:       true,
          skills:          true,
          profileComplete: true,
          createdAt:       true,
          lastSeenAt:      true,
          walletAddress:   true,
          reviewsReceived: { select: { rating: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const now = Date.now();
    const items = users.map((u) => {
      const ratings      = u.reviewsReceived.map((r) => r.rating);
      const reviewsCount = ratings.length;
      const rating       = reviewsCount > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / reviewsCount) * 10) / 10
        : 0;

      return {
        id:              u.id,
        name:            u.name,
        twitterHandle:   u.twitterHandle,
        image:           u.image ?? fallbackImage(u.name, u.twitterHandle),
        role:            u.userTitle ?? null,
        rating,
        reviewsCount,
        chain:           inferChain(u.walletAddress),
        isOnline:        u.lastSeenAt ? now - u.lastSeenAt.getTime() < 3 * 60 * 1000 : false,
        joinedAt:        u.createdAt.toISOString(),
        profileComplete: u.profileComplete,
        skills:          u.skills,
      };
    });

    return ok(items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("[mobile/talent/browse]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withMobileAuth(handler);
