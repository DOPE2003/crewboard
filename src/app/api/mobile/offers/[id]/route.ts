/**
 * PATCH /api/mobile/offers/[id]
 *
 * Update the status of an offer.
 *   - "cancelled"  → owner only (offer sender)
 *   - "accepted"   → recipient only (offer receiver)
 *   - "declined"   → recipient only (offer receiver)
 *
 * Body   { status: "cancelled" | "accepted" | "declined" }
 * 200    { data: <updated offer> }
 * 400    invalid status
 * 401    no/invalid Bearer token
 * 403    caller not authorised for the requested transition
 * 404    offer not found
 * 409    offer already in a terminal state
 *
 * Note: cancelReason is NOT stored — the Offer model has no such column.
 * Dynamic-route handlers can't use withMobileAuth (fixed signature); auth is inline.
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

type Status = "cancelled" | "accepted" | "declined";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getMobileUser(req);
    if (!user) return err("Unauthorized", 401);

    const { id } = await ctx.params;
    if (!id) return err("Offer id is required.");

    const body = await req.json().catch(() => ({}));
    const { status } = body as { status?: Status };

    if (status !== "cancelled" && status !== "accepted" && status !== "declined") {
      return err("status must be 'cancelled', 'accepted', or 'declined'.");
    }

    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        sender:   { select: { id: true, name: true, twitterHandle: true } },
        receiver: { select: { id: true, name: true, twitterHandle: true } },
        order:    { select: { id: true, escrowAddress: true } },
      },
    });

    if (!offer) return err("Offer not found.", 404);

    if (status === "cancelled" && offer.senderId !== user.sub) {
      return err("Only the offer sender can cancel.", 403);
    }
    if ((status === "accepted" || status === "declined") && offer.receiverId !== user.sub) {
      return err("Only the offer receiver can accept or decline.", 403);
    }

    // Terminal states — no further transitions
    if (offer.status === "declined" || offer.status === "cancelled" || offer.status === "completed") {
      return err(`Offer is already ${offer.status}.`, 409);
    }

    // accepted → cancelled only when escrow has never been funded
    if (status === "cancelled" && offer.status === "accepted") {
      if (offer.order?.escrowAddress) {
        return err(
          "Cannot cancel after escrow has been funded — open a dispute instead.",
          409
        );
      }
      // Cancel both the offer and its linked order in one transaction
      await db.$transaction([
        db.offer.update({ where: { id }, data: { status: "cancelled" } }),
        ...(offer.orderId
          ? [db.order.update({ where: { id: offer.orderId }, data: { status: "cancelled" } })]
          : []),
      ]);

      const senderName = offer.sender.name ?? offer.sender.twitterHandle ?? "Someone";

      notifyUser({
        userId: offer.receiverId,
        type: "offer",
        title: "Offer Cancelled",
        body: `${senderName} cancelled "${offer.title}" — no escrow was funded, so no money moved.`,
        link: `/messages/${offer.conversationId}`,
        actionUrl: `crewboard://offer/${offer.id}`,
      }).catch(() => {});

      sendPush({
        userId: offer.receiverId,
        title: "Offer cancelled by client",
        body: offer.title,
        data: { type: "offer_cancelled", refId: offer.id, actionUrl: `crewboard://offer/${offer.id}` },
      }).catch(() => {});

      const updatedOffer = await db.offer.findUnique({
        where: { id },
        include: {
          sender:   { select: { id: true, name: true, twitterHandle: true, image: true } },
          receiver: { select: { id: true, name: true, twitterHandle: true, image: true } },
          order:    { select: { id: true, status: true, escrowAddress: true } },
        },
      });
      return ok(updatedOffer);
    }

    // Standard pending → accepted / declined / cancelled
    if (offer.status !== "pending") {
      return err(`Offer is already ${offer.status}.`, 409);
    }

    const updated = await db.offer.update({
      where: { id },
      data: { status },
      include: {
        sender:   { select: { id: true, name: true, twitterHandle: true, image: true } },
        receiver: { select: { id: true, name: true, twitterHandle: true, image: true } },
        order:    { select: { id: true, status: true, escrowAddress: true } },
      },
    });

    const otherUserId = status === "cancelled" ? offer.receiverId : offer.senderId;
    const actor       = status === "cancelled" ? offer.sender    : offer.receiver;
    const actorName   = actor.name ?? actor.twitterHandle ?? "Someone";

    const notifTitle =
      status === "cancelled" ? "Offer Cancelled"
      : status === "accepted" ? "Offer Accepted"
      : "Offer Declined";

    const notifBody =
      status === "cancelled" ? `${actorName} cancelled the offer "${offer.title}".`
      : status === "accepted" ? `${actorName} accepted your offer "${offer.title}".`
      : `${actorName} declined your offer "${offer.title}".`;

    notifyUser({
      userId: otherUserId,
      type: "offer",
      title: notifTitle,
      body: notifBody,
      link: `/messages/${offer.conversationId}`,
      actionUrl: `crewboard://offer/${offer.id}`,
    }).catch(() => {});

    sendPush({
      userId: otherUserId,
      title: notifTitle,
      body: notifBody,
      data: {
        type:
          status === "cancelled" ? "offer_cancelled"
          : status === "accepted" ? "offer_accepted"
          : "offer_declined",
        actionUrl: `crewboard://offer/${offer.id}`,
        refId: offer.id,
      },
    }).catch(() => {});

    return ok(updated);
  } catch (e) {
    console.error("[mobile/offers/[id] PATCH]", e);
    return err("Something went wrong.", 500);
  }
}
