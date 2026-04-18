/**
 * POST /api/mobile/offers/respond
 *
 * Accept or decline an offer.  Only the receiver can respond; only pending
 * offers can be responded to.
 *
 * On accept: automatically creates a custom Gig + Order (identical to the web
 * app's respondToOffer server action) so the escrow flow works unchanged.
 *
 * Headers  Authorization: Bearer <token>
 * Body     { offerId: string; action: "accept" | "decline" }
 * 200      { data: { status: "accepted"|"declined"; orderId?: string } }
 * 400      { error }
 * 403      { error: "Only the receiver can respond." }
 * 404      { error: "Offer not found." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { offerId, action } = body as { offerId?: string; action?: string };

    if (!offerId) return err("offerId is required.");
    if (action !== "accept" && action !== "decline") {
      return err("action must be 'accept' or 'decline'.");
    }

    const offer = await db.offer.findUnique({
      where: { id: offerId },
      include: {
        sender:   { select: { name: true, twitterHandle: true } },
        receiver: { select: { name: true, twitterHandle: true } },
      },
    });

    if (!offer) return err("Offer not found.", 404);
    if (offer.receiverId !== user.sub) return err("Only the receiver can respond.", 403);
    if (offer.status !== "pending") return err(`Offer is already ${offer.status}.`);

    const receiverName = offer.receiver.name ?? offer.receiver.twitterHandle ?? "Someone";

    if (action === "decline") {
      await db.offer.update({ where: { id: offerId }, data: { status: "declined" } });

      notifyUser({
        userId: offer.senderId,
        type: "offer",
        title: "Offer Declined",
        body: `${receiverName} declined your offer "${offer.title}". You can send a new one.`,
        link: `/messages/${offer.conversationId}`,
        actionUrl: `crewboard://offer/${offerId}`,
      }).catch(() => {});

      sendPush({
        userId: offer.senderId,
        title: `${receiverName} declined your offer`,
        body: offer.title,
        data: { type: "offer_declined", refId: offerId },
      }).catch(() => {});

      return ok({ status: "declined" as const });
    }

    // ── Accept: create custom Gig + Order (mirrors web respondToOffer) ──────

    const gig = await db.gig.create({
      data: {
        userId: offer.receiverId, // seller = receiver of the offer
        title: offer.title,
        description: offer.description,
        price: offer.amount,
        deliveryDays: offer.deliveryDays,
        category: "Custom Offer",
        tags: ["custom-offer"],
        status: "custom",
      },
    });

    const order = await db.order.create({
      data: {
        gigId: gig.id,
        buyerId: offer.senderId,   // buyer = sender of the offer
        sellerId: offer.receiverId,
        amount: offer.amount,
        status: "pending",
      },
    });

    await db.offer.update({
      where: { id: offerId },
      data: { status: "accepted", orderId: order.id },
    });

    notifyUser({
      userId: offer.senderId,
      type: "offer",
      title: "Offer Accepted!",
      body: `${receiverName} accepted your offer "${offer.title}" for $${offer.amount}. Fund the escrow to start!`,
      link: `/orders/${order.id}`,
      actionUrl: `crewboard://order/${order.id}`,
    }).catch(() => {});

    sendPush({
      userId: offer.senderId,
      title: `${receiverName} accepted your offer`,
      body: offer.title,
      data: { type: "offer_accepted", refId: offerId },
    }).catch(() => {});

    return ok({
      status: "accepted" as const,
      orderId: order.id,
      escrowNote: "Fund the escrow using /api/escrow/build-fund to start work.",
    });
  } catch (e) {
    console.error("[mobile/offers/respond]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
