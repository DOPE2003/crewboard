/**
 * POST /api/mobile/escrow/build-admin-force-release
 *
 * Admin-only.  Builds an unsigned admin_force_release transaction.
 * Used when the buyer goes AFK after delivery (14+ days after delivered_at).
 * Same 90/10 split as normal release.
 *
 * The admin signs this with THEIR OWN Solana wallet on their device.
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
 * After submitting on-chain, call POST /api/mobile/escrow/sync-admin-force-release
 * with { orderId, txHash } to verify on-chain and update the DB.
 */
import { NextRequest } from "next/server";
import { PublicKey }   from "@solana/web3.js";
import db              from "@/lib/db";
import { buildAdminForceReleaseTx } from "@/lib/escrow-build";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { hasMinRole } from "@/lib/rbac";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  if (!hasMinRole(user.role, "ADMIN")) return err("Admin only.", 403);

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
    if (order.status !== "delivered" && order.status !== "disputed")
      return err(`Order is ${order.status}, expected delivered or disputed.`);
    if (!order.buyer.walletAddress)  return err("Buyer has no wallet address on file.");
    if (!order.seller.walletAddress) return err("Seller has no wallet address on file.");

    // Admin's own wallet — from their linked wallet in DB
    const admin = await db.user.findUnique({
      where: { id: user.sub },
      select: { walletAddress: true },
    });
    if (!admin?.walletAddress) return err("Admin wallet not linked.");

    const { tx } = await buildAdminForceReleaseTx(
      new PublicKey(admin.walletAddress),
      new PublicKey(order.buyer.walletAddress),
      new PublicKey(order.seller.walletAddress),
      orderId,
    );

    return ok({ tx, blockhashExpiry: Math.floor(Date.now() / 1000) + 60 });
  } catch (e) {
    console.error("[mobile/escrow/build-admin-force-release]", e);
    return err("Failed to build transaction.", 500);
  }
}

export const POST = withMobileAuth(handler);
