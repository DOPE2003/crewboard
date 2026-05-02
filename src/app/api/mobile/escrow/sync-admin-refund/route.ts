/**
 * POST /api/mobile/escrow/sync-admin-refund
 *
 * Admin-only. Call AFTER the admin_refund on-chain tx confirms.
 * Verifies the vault is closed on-chain, then flips the order to "cancelled"
 * and notifies both parties.
 *
 * Used for: seller AFK (is_delivered=false, 14+ days) AND dispute resolution
 * where admin rules in the buyer's favour.
 *
 * Auth:  Bearer <mobile JWT>  (role must be ADMIN)
 *
 * Body:  { orderId: string; txHash: string }
 *
 * 200:  { data: { orderId, status: "cancelled" } }
 * 402:  vault still holds funds — tx not confirmed
 * 503:  RPC unavailable — retry
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { hasMinRole } from "@/lib/rbac";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { verifyEscrowReleased } from "@/lib/escrow-build";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  if (!hasMinRole(user.role, "ADMIN")) return err("Admin only.", 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, txHash } = body as { orderId?: string; txHash?: string };

    if (!orderId) return err("orderId is required.");
    if (!txHash)  return err("txHash is required.");

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true, sellerId: true, status: true, escrowAddress: true,
        buyer:  { select: { walletAddress: true } },
        seller: { select: { walletAddress: true } },
        gig:    { select: { title: true } },
        offer:  { select: { id: true } },
      },
    });

    if (!order) return err("Order not found.", 404);

    // Idempotent
    if (order.status === "cancelled") return ok({ orderId, status: "cancelled" });

    const allowedFrom = ["funded", "accepted", "disputed"];
    if (!allowedFrom.includes(order.status)) {
      return err(`Order is "${order.status}" — refund requires: ${allowedFrom.join(", ")}.`);
    }
    if (!order.escrowAddress) return err("No escrow address on record.", 409);

    const verify = await verifyEscrowReleased(order.escrowAddress, {
      buyerAddress:  order.buyer.walletAddress  ?? undefined,
      sellerAddress: order.seller.walletAddress ?? undefined,
      orderId,
    });
    if (!verify.ok) {
      if (verify.rpcError) return err("Solana RPC unavailable — retry in a moment.", 503);
      return err(verify.error, 402);
    }

    await db.order.update({
      where: { id: orderId },
      data: { status: "cancelled", txHash },
    });

    const offerRef = order.offer?.id ?? orderId;

    notifyUser({
      userId: order.buyerId,
      type: "order",
      title: "Refund Processed",
      body: `Admin refunded your payment for "${order.gig.title}" — funds are back in your wallet.`,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Order Cancelled by Admin",
      body: `Admin cancelled "${order.gig.title}" and refunded the buyer.`,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    sendPush({
      userId: order.buyerId,
      title: "Refund Processed",
      body: `Your payment for "${order.gig.title}" has been refunded`,
      data: {
        type: "order_refunded",
        actionUrl: `crewboard://offer/${offerRef}`,
        offerId: offerRef,
        orderId,
        jobTitle: order.gig.title,
      },
    }).catch(() => {});

    return ok({ orderId, status: "cancelled" });
  } catch (e) {
    console.error("[mobile/escrow/sync-admin-refund]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
