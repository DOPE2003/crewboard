/**
 * DELETE /api/mobile/users/me  — self-service hard-delete
 *
 * Apple App Store Guideline 5.1.1(v) requires that any app offering account
 * creation also offers a way to permanently delete the account from inside
 * the app. This is the endpoint the iOS "Delete Account" button calls.
 *
 * Behavior mirrors the existing web action `src/actions/deleteAccount.ts`
 * (single $transaction, same dependency order) so a deletion behaves
 * identically whether it originated from the iOS app or the web profile
 * page. The OWNER account is protected — it can never be self-deleted.
 *
 * Headers: Authorization: Bearer <mobile JWT>
 *
 * → 200 { data: { deleted: true, id } }
 * → 401 Unauthorized            (missing / invalid token)
 * → 403 Forbidden               (caller is the OWNER)
 * → 404 User not found          (already gone — caller can treat as success)
 * → 500 Server error
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { logAdminAction } from "@/lib/audit";

export async function DELETE(req: NextRequest) {
  const caller = await getMobileUser(req);
  if (!caller) return err("Unauthorized", 401);

  const userId = caller.sub;

  // The OWNER account can never be self-deleted — we always need at
  // least one OWNER for admin operations to work.
  const ownerId = process.env.OWNER_USER_ID;
  if (ownerId && userId === ownerId) {
    return err("The owner account cannot be deleted from the app.", 403);
  }

  try {
    const target = await db.user.findUnique({
      where: { id: userId },
      select: { twitterHandle: true, role: true },
    });
    if (!target) return err("User not found.", 404);
    if (target.role === "OWNER") {
      return err("The owner account cannot be deleted from the app.", 403);
    }

    // Same dependency order as src/actions/deleteAccount.ts.
    await db.$transaction([
      db.showcaseInteraction.deleteMany({ where: { userId } }),
      db.showcasePost.deleteMany({ where: { userId } }),
      db.savedTalent.deleteMany({
        where: { OR: [{ saverId: userId }, { savedUserId: userId }] },
      }),
      db.notification.deleteMany({ where: { userId } }),
      db.message.deleteMany({ where: { senderId: userId } }),
      db.review.deleteMany({
        where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] },
      }),
      db.order.deleteMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          status: { in: ["completed", "cancelled"] },
        },
      }),
      db.gig.deleteMany({ where: { userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    logAdminAction({
      actorId: userId,
      action: "user.delete",
      targetId: userId,
      metadata: { handle: target.twitterHandle, source: "mobile_self_delete" },
    });

    return ok({ deleted: true, id: userId });
  } catch (e: any) {
    if (e?.code === "P2025") return err("User not found.", 404);
    console.error("[mobile/users/me DELETE]", e);
    return err("Something went wrong.", 500);
  }
}
