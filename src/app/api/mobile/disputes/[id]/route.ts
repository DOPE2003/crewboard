/**
 * GET   /api/mobile/disputes/:id     — detail (messages + evidence)
 * PATCH /api/mobile/disputes/:id     — cancel (filer only, from "open")
 *
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { DISPUTE_INCLUDE, formatDispute } from "../../_lib/dispute-utils";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getMobileUser(req);
    if (!user) return err("Unauthorized", 401);

    const { id } = await ctx.params;

    const dispute = await db.dispute.findUnique({
      where:   { id },
      include: DISPUTE_INCLUDE,
    });

    if (!dispute) return err("Dispute not found.", 404);

    const { buyerId, sellerId } = dispute.order;
    if (user.sub !== buyerId && user.sub !== sellerId) {
      return err("You are not a participant in this dispute.", 403);
    }

    return ok(formatDispute(dispute));
  } catch (e) {
    console.error("[mobile/disputes/[id] GET]", e);
    return err("Something went wrong.", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getMobileUser(req);
    if (!user) return err("Unauthorized", 401);

    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { status } = body as { status?: string };

    if (status !== "cancelled") return err("Only 'cancelled' is allowed via this endpoint.");

    const dispute = await db.dispute.findUnique({
      where:  { id },
      select: {
        filedById:           true,
        status:              true,
        orderId:             true,
        previousOrderStatus: true,
        order: {
          select: {
            buyerId: true, sellerId: true,
            buyer:   { select: { name: true, twitterHandle: true } },
            seller:  { select: { name: true, twitterHandle: true } },
            gig:     { select: { title: true } },
          },
        },
      },
    });

    if (!dispute) return err("Dispute not found.", 404);

    const { buyerId, sellerId } = dispute.order;
    if (user.sub !== buyerId && user.sub !== sellerId) {
      return err("You are not a participant in this dispute.", 403);
    }
    if (dispute.filedById !== user.sub) return err("Only the filer can cancel.", 403);
    if (dispute.status !== "open")      return err(`Cannot cancel a dispute in "${dispute.status}" status.`);

    const actorName = user.sub === buyerId
      ? (dispute.order.buyer.name  ?? dispute.order.buyer.twitterHandle)
      : (dispute.order.seller.name ?? dispute.order.seller.twitterHandle);
    const otherId = user.sub === buyerId ? sellerId : buyerId;

    const updated = await db.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id },
        data:  {
          status:   "cancelled",
          messages: { create: { body: `Dispute cancelled by ${actorName}.`, isSystem: true } },
        },
        include: DISPUTE_INCLUDE,
      });

      if (d.previousOrderStatus) {
        await tx.order.update({
          where: { id: d.orderId },
          data:  { status: d.previousOrderStatus },
        });
      }

      return d;
    });

    notifyUser({
      userId:    otherId,
      type:      "order",
      title:     "Dispute Cancelled",
      body:      `${actorName} cancelled the dispute for "${dispute.order.gig.title}"`,
      link:      `/orders/${dispute.orderId}`,
      actionUrl: `crewboard://dispute/${id}`,
    }).catch(() => {});

    sendPush({
      userId: otherId,
      title:  "Dispute Cancelled",
      body:   `${actorName} withdrew the dispute for "${dispute.order.gig.title}"`,
      data: {
        type:      "dispute_cancelled",
        actionUrl: `crewboard://dispute/${id}`,
        disputeId: id,
        orderId:   dispute.orderId,
        jobTitle:  dispute.order.gig.title,
      },
    }).catch(() => {});

    return ok(formatDispute(updated));
  } catch (e) {
    console.error("[mobile/disputes/[id] PATCH]", e);
    return err("Something went wrong.", 500);
  }
}
