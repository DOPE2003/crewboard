/**
 * POST /api/mobile/escrow/sync-released
 *
 * Called by iOS after the release_funds transaction is confirmed on-chain.
 * Flips order status to "completed" and notifies the seller.
 *
 * Auth:  Bearer <mobile JWT>  (must be the buyer)
 *
 * Body:  { orderId: string; txHash: string }
 *
 * 200:  { data: { orderId, status: "completed" } }
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
    const { orderId, txHash } = body as { orderId?: string; txHash?: string };

    if (!orderId) return err("orderId is required.");
    if (!txHash)  return err("txHash is required.");

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true, sellerId: true, status: true, amount: true,
        gig: { select: { title: true } },
      },
    });

    if (!order)                       return err("Order not found.", 404);
    if (order.buyerId !== user.sub)   return err("Only the buyer can confirm release.", 403);
    if (order.status !== "delivered") {
      if (order.status === "completed") return ok({ orderId, status: "completed" }); // idempotent
      return err(`Order is ${order.status}, expected delivered.`);
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "completed", txHash },
    });

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Payment Released!",
      body: `You've been paid for "${order.gig.title}" — funds are in your wallet.`,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    sendPush({
      userId: order.sellerId,
      title: "Payment released",
      body: `$${order.amount} · ${order.gig.title} — review the collaboration`,
      data: { type: "payment_released", refId: orderId },
    }).catch(() => {});

    return ok({ orderId, status: "completed" });
  } catch (e) {
    console.error("[mobile/escrow/sync-released]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
