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
import { verifyEscrowReleased } from "@/lib/escrow-build";
import { addOrderToPortfolio } from "@/lib/auto-portfolio";

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
        escrowAddress: true,
        buyer:  { select: { name: true, twitterHandle: true, walletAddress: true } },
        seller: { select: { walletAddress: true } },
        gig:    { select: { title: true, category: true, image: true } },
        offer:  { select: { id: true, title: true } },
      },
    });

    if (!order)                       return err("Order not found.", 404);
    if (order.buyerId !== user.sub)   return err("Only the buyer can confirm release.", 403);
    if (order.status !== "delivered") {
      if (order.status === "completed") return ok({ orderId, status: "completed" }); // idempotent
      return err(`Order is ${order.status}, expected delivered.`);
    }

    if (!order.escrowAddress) return err("No escrow address on record — funds were never locked on-chain.", 409);

    // Verify on-chain: vault must be closed before marking complete.
    // Rejects fake txHash — DB never flips to "completed" without chain confirmation.
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

    addOrderToPortfolio(order.sellerId, {
      title: order.offer?.title ?? order.gig.title,
      category: order.gig.category,
      imageUrl: order.gig.image,
      amount: order.amount,
    }).catch(() => {});

    const buyerName = order.buyer.name ?? `@${order.buyer.twitterHandle}`;
    const offerRef = order.offer?.id ?? orderId;
    const isSelfRelease = order.buyerId === order.sellerId;

    if (!isSelfRelease) {
      notifyUser({
        userId: order.sellerId,
        senderId: order.buyerId,
        type: "payment",
        title: "💸 Payment received",
        body: `You received ${order.amount} USDC from ${buyerName} for "${order.gig.title}"`,
        link: `/orders/${orderId}`,
        actionUrl: `crewboard://order/${orderId}`,
        messageId: `payment-released-${txHash}`,
      }).catch(() => {});

      sendPush({
        userId: order.sellerId,
        title: "💸 Payment received",
        body: `You received ${order.amount} USDC from ${buyerName}`,
        data: {
          type: "payment",
          actionUrl: `crewboard://order/${orderId}`,
          offerId: offerRef,
          orderId,
          amountUSDC: String(order.amount),
          txHash,
          fromUserId: order.buyerId,
          fromUserName: buyerName,
        },
      }).catch(() => {});
    }

    return ok({ orderId, status: "completed" });
  } catch (e) {
    console.error("[mobile/escrow/sync-released]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
