/**
 * POST /api/mobile/admin/users/:id/og
 *
 * Grant or revoke the OG badge.  OWNER only — no delegation.
 *
 * Body:  { action: "grant" | "revoke" }
 * 200:   { data: { id, isOG, ogGrantedAt } }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../../_lib/auth";
import { ok, err } from "../../../../_lib/response";
import { hasMinRole } from "@/lib/rbac";
import { logAdminAction } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  try {
    const caller = await getMobileUser(req);
    if (!caller) return err("Unauthorized", 401);
    if (!hasMinRole(caller.role, "OWNER")) return err("Owner only.", 403);

    const { id } = await ctx.params;
    const body   = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action !== "grant" && action !== "revoke") {
      return err('action must be "grant" or "revoke".');
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { isOG: true, twitterHandle: true },
    });
    if (!target) return err("User not found.", 404);

    const isGrant = action === "grant";

    const updated = await db.user.update({
      where: { id },
      data: {
        isOG:        isGrant,
        ogGrantedAt: isGrant ? new Date() : null,
      },
      select: { id: true, twitterHandle: true, isOG: true, ogGrantedAt: true },
    });

    logAdminAction({ actorId: caller.sub, action: isGrant ? "og.grant" : "og.revoke", targetId: id });

    if (isGrant) {
      notifyUser({
        userId: id,
        type:   "og_badge",
        title:  "You earned the OG Badge",
        body:   "You're one of the founding builders on Crewboard. Your OG badge is now live on your profile.",
      }).catch(() => {});

      sendPush({
        userId: id,
        title:  "OG Badge Unlocked",
        body:   "You're an OG — check your profile to see your new badge.",
        data:   { type: "og_badge", actionUrl: `crewboard://profile/${target.twitterHandle}` },
      }).catch(() => {});
    }

    return ok(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return err("User not found.", 404);
    console.error("[mobile/admin/users/[id]/og POST]", e);
    return err("Something went wrong.", 500);
  }
}
