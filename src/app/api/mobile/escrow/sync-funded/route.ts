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
import { sendPush } from "@/lib/push";
import { verifyEscrowVaultFunded } from "@/lib/escrow-build";

async function redeemCampaignClaim(orderId: string, buyerId: string, orderAmountUsdc: number, gigTitle: string) {
  const claim = await db.campaignClaim.findFirst({
    where: {
      userId: buyerId,
      status: { in: ["pending", "qualified", "redeemed"] },
      feeRebatesRemaining: { gt: 0 },
      expiresAt: { gt: new Date() },
    },
  });
  if (!claim) return;

  const isFirst = claim.status === "pending";

  await db.$transaction([
    db.campaignClaim.update({
      where: { id: claim.id },
      data: {
        status: "redeemed",
        redeemedAt: isFirst ? new Date() : undefined,
        firstOrderId: isFirst ? orderId : undefined,
        feeRebatesRemaining: { decrement: 1 },
        creditRemainingUsdc: { decrement: Math.min(orderAmountUsdc, claim.creditRemainingUsdc) },
        ogBadgeGranted: isFirst ? true : undefined,
      },
    }),
    ...(isFirst
      ? [
          db.user.update({
            where: { id: buyerId },
            data: { ogFoundingClient: true },
          }),
          db.order.update({
            where: { id: orderId },
            data: { feeOverridePct: 0, campaignClaimId: claim.id },
          }),
        ]
      : [
          db.order.update({
            where: { id: orderId },
            data: { feeOverridePct: 0, campaignClaimId: claim.id },
          }),
        ]),
  ]);

  if (isFirst) {
    notifyUser({
      userId: buyerId,
      type: "system",
      title: "Welcome, OG Founding Client!",
      body: `$50 credit applied + 2 free hires remaining for "${gigTitle}".`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});
  }
}

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
        buyerId: true, sellerId: true, status: true, amount: true,
        buyer:  { select: { name: true, twitterHandle: true, walletAddress: true } },
        seller: { select: { walletAddress: true } },
        gig:    { select: { title: true } },
        offer:  { select: { id: true, conversationId: true } },
      },
    });

    if (!order)                       return err("Order not found.", 404);
    if (order.buyerId !== user.sub)   return err("Only the buyer can confirm funding.", 403);
    if (order.status !== "pending") {
      // Idempotent — already funded (e.g. tx landed but client crashed before calling sync)
      if (order.status === "funded")  return ok({ orderId, status: "funded", conversationId: order.offer?.conversationId ?? null });
      return err(`Order is ${order.status}, expected pending.`);
    }

    // Verify on-chain: PDA must match this order, vault must exist and hold expected USDC.
    // Fail closed on rpcError — 503 tells iOS to retry when RPC recovers.
    const verify = await verifyEscrowVaultFunded(escrowAddress, order.amount, {
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
      data: { status: "funded", txHash, escrowAddress },
    });

    // Campaign claim hook: if buyer has an active miracle claim, apply fee rebate and flip to redeemed
    redeemCampaignClaim(orderId, order.buyerId, order.amount, order.gig.title).catch(() => {});

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Order Funded",
      body: `Payment for "${order.gig.title}" is locked in escrow — start working!`,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    const buyerName = order.buyer.name ?? `@${order.buyer.twitterHandle}`;
    const offerRef = order.offer?.id ?? orderId;

    sendPush({
      userId: order.sellerId,
      title: "Payment Secured",
      body: `${buyerName} locked $${order.amount} USDC in escrow for "${order.gig.title}" — start working!`,
      data: {
        type: "escrow_funded",
        actionUrl: `crewboard://offer/${offerRef}`,
        offerId: offerRef,
        orderId,
        buyerName,
        jobTitle: order.gig.title,
      },
    }).catch(() => {});

    return ok({ orderId, status: "funded", conversationId: order.offer?.conversationId ?? null });
  } catch (e) {
    console.error("[mobile/escrow/sync-funded]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
