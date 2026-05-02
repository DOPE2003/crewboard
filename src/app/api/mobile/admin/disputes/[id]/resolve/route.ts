/**
 * POST /api/mobile/admin/disputes/:id/resolve
 * Resolve a dispute and record the decision.
 * Auth: ADMIN or OWNER
 *
 * Body: { decision: "refund" | "release" | "split", notes?: string }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../../_lib/auth";
import { ok, err } from "../../../../_lib/response";
import { hasMinRole } from "@/lib/rbac";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { logAdminAction } from "@/lib/audit";

const VALID_DECISIONS = new Set(["refund", "release", "split"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const caller = await getMobileUser(req);
    if (!caller) return err("Unauthorized", 401);
    if (!hasMinRole(caller.role, "ADMIN")) return err("Admin only.", 403);

    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { decision, notes } = body as { decision?: string; notes?: string };

    if (!decision || !VALID_DECISIONS.has(decision)) {
      return err(`decision must be one of: ${[...VALID_DECISIONS].join(", ")}.`);
    }

    const dispute = await db.dispute.findUnique({
      where: { id },
      select: {
        status: true, orderId: true, filedById: true,
        order: {
          select: {
            buyerId: true, sellerId: true,
            buyer:  { select: { name: true, twitterHandle: true } },
            seller: { select: { name: true, twitterHandle: true } },
            gig:    { select: { title: true } },
          },
        },
      },
    });

    if (!dispute) return err("Dispute not found.", 404);
    if (dispute.status === "resolved" || dispute.status === "cancelled") {
      return err(`Dispute is already ${dispute.status}.`);
    }

    const resolution = { decision, notes: notes?.trim() ?? null, resolvedBy: caller.sub };

    const updated = await db.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id },
        data: {
          status: "resolved",
          resolution,
          resolvedAt: new Date(),
          messages: {
            create: {
              isSystem: true,
              body: `Dispute resolved by admin: ${decision}${notes ? ` — ${notes.trim()}` : ""}.`,
            },
          },
        },
        select: { id: true, status: true, resolution: true, resolvedAt: true },
      });

      // If refund/release, restore order status appropriately
      if (decision === "refund") {
        await tx.order.update({ where: { id: dispute.orderId }, data: { status: "cancelled" } });
      } else if (decision === "release") {
        await tx.order.update({ where: { id: dispute.orderId }, data: { status: "completed" } });
      }

      return d;
    });

    const { buyerId, sellerId } = dispute.order;
    const jobTitle = dispute.order.gig.title;

    for (const userId of [buyerId, sellerId]) {
      notifyUser({
        userId, type: "order",
        title: "Dispute Resolved",
        body: `Your dispute for "${jobTitle}" has been resolved: ${decision}.`,
        link: `/orders/${dispute.orderId}`,
        actionUrl: `crewboard://dispute/${id}`,
      }).catch(() => {});

      sendPush({
        userId, title: "Dispute Resolved",
        body: `"${jobTitle}" dispute: ${decision}.`,
        data: { type: "dispute_resolved", disputeId: id, orderId: dispute.orderId, decision },
      }).catch(() => {});
    }

    logAdminAction({ actorId: caller.sub, action: "dispute.resolve", targetId: id, metadata: { decision, orderId: dispute.orderId } });

    return ok(updated);
  } catch (e) {
    console.error("[mobile/admin/disputes/[id]/resolve]", e);
    return err("Something went wrong.", 500);
  }
}
