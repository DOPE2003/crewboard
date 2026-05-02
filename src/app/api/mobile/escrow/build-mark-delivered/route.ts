/**
 * POST /api/mobile/escrow/build-mark-delivered
 *
 * Builds an UNSIGNED mark_delivered transaction for the seller.
 * Sets is_delivered = true and stamps delivered_at on-chain.
 * Starts the 14-day AFK clock for admin_force_release.
 *
 * After signing and submitting, the iOS client should also call
 * POST /api/mobile/orders/status  { orderId, status: "delivered" }
 * to update the DB (no separate sync endpoint needed — it's a DB-only flag).
 *
 * Auth:  Bearer <mobile JWT>  (must be the seller)
 *
 * Body:  { orderId: string }
 *
 * 200:
 * {
 *   data: {
 *     tx: string            // base64 unsigned transaction
 *     blockhashExpiry: number
 *   }
 * }
 */
import { NextRequest } from "next/server";
import { PublicKey }   from "@solana/web3.js";
import db              from "@/lib/db";
import { buildMarkDeliveredTx } from "@/lib/escrow-build";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body as { orderId?: string };

    if (!orderId) return err("orderId is required.");

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true, sellerId: true, status: true,
        buyer:  { select: { walletAddress: true } },
        seller: { select: { walletAddress: true } },
      },
    });

    if (!order)                        return err("Order not found.", 404);
    if (order.sellerId !== user.sub)   return err("Only the seller can mark as delivered.", 403);
    if (order.status !== "funded" && order.status !== "revision_requested") {
      return err(`Order is ${order.status}, expected funded.`);
    }
    if (!order.seller.walletAddress)   return err("Your wallet is not linked.");
    if (!order.buyer.walletAddress)    return err("Buyer has no wallet address on file.");

    const { tx } = await buildMarkDeliveredTx(
      new PublicKey(order.seller.walletAddress),
      new PublicKey(order.buyer.walletAddress),
      orderId,
    );

    return ok({ tx, blockhashExpiry: Math.floor(Date.now() / 1000) + 60 });
  } catch (e) {
    console.error("[mobile/escrow/build-mark-delivered]", e);
    return err("Failed to build transaction.", 500);
  }
}

export const POST = withMobileAuth(handler);
