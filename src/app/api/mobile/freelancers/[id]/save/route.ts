/**
 * POST   /api/mobile/freelancers/:id/save   — save a freelancer (idempotent)
 * DELETE /api/mobile/freelancers/:id/save   — unsave (idempotent)
 *
 * Returns: { saved: boolean, savedCount: number }
 *
 * Fires a bell notification on save milestones: 1, 5, 10, 25, 50, 100, 500, 1000.
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import { notifyUser } from "@/lib/notify";

const MILESTONES = [1, 5, 10, 25, 50, 100, 500, 1000];

async function saveHandler(
  req: NextRequest,
  user: MobileTokenPayload,
  { params }: { params: { id: string } },
) {
  const savedUserId = params.id;
  if (!savedUserId) return err("User id is required.", 400);
  if (savedUserId === user.sub) return err("Cannot save yourself.", 400);

  try {
    await db.savedTalent.upsert({
      where: { saverId_savedUserId: { saverId: user.sub, savedUserId } },
      create: { saverId: user.sub, savedUserId },
      update: {},
    });

    const savedCount = await db.savedTalent.count({ where: { savedUserId } });

    if (MILESTONES.includes(savedCount)) {
      notifyUser({
        userId: savedUserId,
        type: "save_milestone",
        title: savedCount === 1 ? "Your first save!" : `Milestone: ${savedCount} saves`,
        body: savedCount === 1
          ? "Someone just saved your profile."
          : `${savedCount} people have saved your profile — keep the momentum.`,
        link: "/profile",
        actionUrl: "crewboard://profile/saves",
      }).catch(() => {});
    }

    return ok({ saved: true, savedCount });
  } catch (e) {
    console.error("[mobile/freelancers/save POST]", e);
    return err("Something went wrong.", 500);
  }
}

async function unsaveHandler(
  req: NextRequest,
  user: MobileTokenPayload,
  { params }: { params: { id: string } },
) {
  const savedUserId = params.id;

  try {
    await db.savedTalent.deleteMany({
      where: { saverId: user.sub, savedUserId },
    });

    const savedCount = await db.savedTalent.count({ where: { savedUserId } });

    return ok({ saved: false, savedCount });
  } catch (e) {
    console.error("[mobile/freelancers/save DELETE]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST   = withMobileAuth(saveHandler as any);
export const DELETE = withMobileAuth(unsaveHandler as any);
