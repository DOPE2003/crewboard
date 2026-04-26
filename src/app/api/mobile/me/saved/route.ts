/**
 * GET /api/mobile/me/saved?limit=50&cursor=<savedTalentId>
 *
 * Returns the authenticated user's saved freelancers (cursor-paginated).
 * iOS uses this to re-hydrate local favorites on new device / re-install.
 *
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const sp     = req.nextUrl.searchParams;
    const limit  = Math.min(100, parseInt(sp.get("limit") ?? "50", 10));
    const cursor = sp.get("cursor") ?? undefined;

    const rows = await db.savedTalent.findMany({
      where: { saverId: user.sub },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        createdAt: true,
        savedUser: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            image: true,
            userTitle: true,
            skills: true,
            profileComplete: true,
          },
        },
      },
    });

    const hasMore    = rows.length > limit;
    const items      = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return ok(
      items.map((r) => ({ ...r.savedUser, savedAt: r.createdAt })),
      { nextCursor },
    );
  } catch (e) {
    console.error("[mobile/me/saved]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withMobileAuth(handler);
