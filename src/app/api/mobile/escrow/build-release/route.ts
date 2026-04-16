/**
 * POST /api/mobile/escrow/build-release
 *
 * Builds an UNSIGNED release_funds transaction.
 * Buyer signs and submits on iOS, then calls sync-released.
 * On-chain: 90% → seller, 10% → treasury.  No backend fee logic needed.
 *
 * Auth:  Bearer <mobile JWT>  (must be the buyer)
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
import { buildReleaseTx } from "@/lib/escrow-build";
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

    if (!order)                       return err("Order not found.", 404);
    if (order.buyerId !== user.sub)   return err("Only the buyer can release funds.", 403);
    if (order.status !== "delivered") return err(`Order is ${order.status}, expected delivered.`);
    if (!order.buyer.walletAddress)   return err("Your wallet is not linked.");
    if (!order.seller.walletAddress)  return err("Seller has no wallet address on file.");

    const { tx } = await buildReleaseTx(
      new PublicKey(order.buyer.walletAddress),
      new PublicKey(order.seller.walletAddress),
      orderId,
    );

    return ok({ tx, blockhashExpiry: Math.floor(Date.now() / 1000) + 60 });
  } catch (e) {
    console.error("[mobile/escrow/build-release]", e);
    return err("Failed to build transaction.", 500);
  }
}

export const POST = withMobileAuth(handler);
