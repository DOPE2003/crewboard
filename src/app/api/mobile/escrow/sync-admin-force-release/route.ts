/**
 * POST /api/mobile/escrow/sync-admin-force-release
 *
 * Admin-only. Call AFTER the admin_force_release on-chain tx confirms.
 * Verifies the vault is closed on-chain, then flips the order to "completed"
 * and notifies both parties.
 *
 * Auth:  Bearer <mobile JWT>  (role must be ADMIN)
 *
 * Body:  { orderId: string; txHash: string }
 *
 * 200:  { data: { orderId, status: "completed" } }
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
    if (order.status === "completed") return ok({ orderId, status: "completed" });

    if (order.status !== "delivered" && order.status !== "disputed") {
      return err(`Order is "${order.status}" — force release requires delivered or disputed.`);
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
      data: { status: "completed", txHash },
    });

    const offerRef = order.offer?.id ?? orderId;

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Payment Released by Admin",
      body: `Admin released your payment for "${order.gig.title}" — funds are in your wallet.`,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    notifyUser({
      userId: order.buyerId,
      type: "order",
      title: "Order Completed",
      body: `"${order.gig.title}" was completed by admin — payment released to seller.`,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    sendPush({
      userId: order.sellerId,
      title: "Payment Released",
      body: `Admin released payment for "${order.gig.title}"`,
      data: {
        type: "payment_released",
        actionUrl: `crewboard://offer/${offerRef}`,
        offerId: offerRef,
        orderId,
        jobTitle: order.gig.title,
      },
    }).catch(() => {});

    return ok({ orderId, status: "completed" });
  } catch (e) {
    console.error("[mobile/escrow/sync-admin-force-release]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
