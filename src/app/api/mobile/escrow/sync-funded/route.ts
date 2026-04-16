/**
 * POST /api/mobile/escrow/sync-funded
 *
 * Called by the iOS client AFTER it has signed the build-fund transaction,
 * submitted it to the Solana RPC, and received confirmation.
 * Flips the order status to "funded" in the DB and notifies the seller.
 *
 * Auth:  Bearer <mobile JWT>  (must be the buyer)
 *
 * Body:
 * {
 *   orderId:       string   // Crewboard order id
 *   txHash:        string   // confirmed Solana transaction signature
 *   escrowAddress: string   // escrow PDA returned by build-fund
 * }
 *
 * 200:  { data: { orderId, status: "funded" } }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { notifyUser } from "@/lib/notify";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, txHash, escrowAddress } = body as {
      orderId?: string; txHash?: string; escrowAddress?: string;
    };

    if (!orderId)       return err("orderId is required.");
    if (!txHash)        return err("txHash is required.");
    if (!escrowAddress) return err("escrowAddress is required.");

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true, sellerId: true, status: true,
        gig: { select: { title: true } },
      },
    });

    if (!order)                       return err("Order not found.", 404);
    if (order.buyerId !== user.sub)   return err("Only the buyer can confirm funding.", 403);
    if (order.status !== "pending") {
      // Idempotent — already funded (e.g. tx landed but client crashed before calling sync)
      if (order.status === "funded")  return ok({ orderId, status: "funded" });
      return err(`Order is ${order.status}, expected pending.`);
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "funded", txHash, escrowAddress },
    });

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Order Funded",
      body: `Payment for "${order.gig.title}" is locked in escrow — start working!`,
      link: `/orders/${orderId}`,
    }).catch(() => {});

    return ok({ orderId, status: "funded" });
  } catch (e) {
    console.error("[mobile/escrow/sync-funded]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
