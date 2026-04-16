/**
 * POST /api/mobile/escrow/build-admin-refund
 *
 * Admin-only.  Builds an unsigned admin_refund transaction.
 * Used when the seller never delivers (14+ days after created_at, is_delivered = false).
 * Full refund to buyer — no platform fee taken.
 *
 * Also used as the "resolve dispute in buyer's favour" action.
 *
 * The admin signs this with THEIR OWN Solana wallet.
 * Only users with role === "ADMIN" can call this endpoint.
 *
 * Auth:  Bearer <mobile JWT>  (role must be ADMIN)
 *
 * Body:  { orderId: string }
 *
 * 200:
 * {
 *   data: {
 *     tx: string
 *     blockhashExpiry: number
 *   }
 * }
 *
 * After submitting on-chain, call POST /api/mobile/orders/status
 * with { orderId, status: "cancelled" } to update the DB.
 */
import { NextRequest } from "next/server";
import { PublicKey }   from "@solana/web3.js";
import db              from "@/lib/db";
import { buildAdminRefundTx } from "@/lib/escrow-build";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  if (user.role !== "ADMIN") return err("Admin only.", 403);

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

    if (!order)                     return err("Order not found.", 404);
    if (!["funded","accepted","disputed"].includes(order.status))
      return err(`Order is ${order.status}. Expected funded, accepted, or disputed.`);
    if (!order.buyer.walletAddress)  return err("Buyer has no wallet address on file.");
    if (!order.seller.walletAddress) return err("Seller has no wallet address on file.");

    const admin = await db.user.findUnique({
      where: { id: user.sub },
      select: { walletAddress: true },
    });
    if (!admin?.walletAddress) return err("Admin wallet not linked.");

    const { tx } = await buildAdminRefundTx(
      new PublicKey(admin.walletAddress),
      new PublicKey(order.buyer.walletAddress),
      new PublicKey(order.seller.walletAddress),
      orderId,
    );

    return ok({ tx, blockhashExpiry: Math.floor(Date.now() / 1000) + 60 });
  } catch (e) {
    console.error("[mobile/escrow/build-admin-refund]", e);
    return err("Failed to build transaction.", 500);
  }
}

export const POST = withMobileAuth(handler);
