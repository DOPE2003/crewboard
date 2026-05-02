/**
 * POST /api/mobile/disputes/:id/messages
 * Body: { text: string }
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getMobileUser(req);
    if (!user) return err("Unauthorized", 401);

    const { id } = await ctx.params;

    const body = await req.json().catch(() => ({}));
    const { text } = body as { text?: string };
    const trimmedText = text?.trim() ?? "";
    if (!trimmedText) return err("text is required.");

    const dispute = await db.dispute.findUnique({
      where:  { id },
      select: {
        status:  true,
        orderId: true,
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

    if (dispute.status === "resolved" || dispute.status === "cancelled") {
      return err(`Cannot message on a ${dispute.status} dispute.`);
    }

    const message = await db.disputeMessage.create({
      data: {
        disputeId: id,
        senderId:  user.sub,
        body:      trimmedText,
      },
      include: {
        sender: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    });

    const isBuyer   = user.sub === buyerId;
    const actorName = isBuyer
      ? (dispute.order.buyer.name  ?? dispute.order.buyer.twitterHandle)
      : (dispute.order.seller.name ?? dispute.order.seller.twitterHandle);
    const otherId   = isBuyer ? sellerId : buyerId;

    notifyUser({
      userId:    otherId,
      type:      "order",
      title:     "Dispute Message",
      body:      `${actorName}: ${trimmedText.slice(0, 100)}`,
      link:      `/orders/${dispute.orderId}`,
      actionUrl: `crewboard://dispute/${id}`,
    }).catch(() => {});

    sendPush({
      userId: otherId,
      title:  "Dispute Message",
      body:   `${actorName}: ${trimmedText.slice(0, 80)}`,
      data: {
        type:      "dispute_message",
        actionUrl: `crewboard://dispute/${id}`,
        disputeId: id,
        orderId:   dispute.orderId,
        jobTitle:  dispute.order.gig.title,
      },
    }).catch(() => {});

    return ok({ message });
  } catch (e) {
    console.error("[mobile/disputes/[id]/messages POST]", e);
    return err("Something went wrong.", 500);
  }
}
