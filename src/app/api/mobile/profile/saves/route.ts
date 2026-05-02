/**
 * GET /api/mobile/profile/saves
 *
 * Returns save stats for the authenticated user's own profile.
 * { total, recent7d, savers: [...] }  (savers hidden until total >= 3)
 *
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(_req: NextRequest, user: MobileTokenPayload) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, recent7d, savers] = await Promise.all([
      db.savedTalent.count({ where: { savedUserId: user.sub } }),
      db.savedTalent.count({
        where: { savedUserId: user.sub, createdAt: { gte: sevenDaysAgo } },
      }),
      db.savedTalent.findMany({
        where: { savedUserId: user.sub },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          createdAt: true,
          saver: { select: { id: true, name: true, twitterHandle: true, image: true } },
        },
      }),
    ]);

    return ok({
      total,
      recent7d,
      // privacy: don't reveal savers until 3+ saves
      savers: total >= 3
        ? savers.map((s) => ({ ...s.saver, savedAt: s.createdAt }))
        : [],
    });
  } catch (e) {
    console.error("[mobile/profile/saves]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withMobileAuth(handler);
