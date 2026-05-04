/**
 * GET /api/campaigns/miracle/analytics
 *
 * Protected by MIRACLE_API_KEY bearer token (for theMiracle reporting).
 * Returns campaign-level metrics for the miracle-de-2026 campaign.
 *
 * Header: Authorization: Bearer <MIRACLE_API_KEY>
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const CAMPAIGN_ID = "miracle-de-2026";

export async function GET(req: NextRequest) {
  const apiKey = process.env.MIRACLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Analytics not configured." }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ") || authHeader.slice(7).trim() !== apiKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const claims = await db.campaignClaim.findMany({
    where: { campaign: CAMPAIGN_ID },
    orderBy: { claimedAt: "asc" },
  });

  const claimed  = claims.length;
  const redeemed = claims.filter((c) => c.status === "redeemed").length;
  const ogBadgesGranted = claims.filter((c) => c.ogBadgeGranted).length;

  // Sum escrow amounts for orders linked to redeemed claims
  const redeemedOrderIds = claims
    .filter((c) => c.firstOrderId)
    .map((c) => c.firstOrderId as string);

  const orders = redeemedOrderIds.length > 0
    ? await db.order.findMany({
        where: { id: { in: redeemedOrderIds } },
        select: { id: true, amount: true, buyerId: true },
      })
    : [];

  const totalEscrowFundedUsdc = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalCreditConsumedUsdc = claims.reduce(
    (sum, c) => sum + (c.creditAmountUsdc - c.creditRemainingUsdc),
    0
  );

  const perWallet = claims.map((c) => ({
    wallet: c.walletAddress,
    status: c.status,
    claimedAt: c.claimedAt,
    redeemedAt: c.redeemedAt ?? null,
    firstOrderId: c.firstOrderId ?? null,
    ordersFunded: c.firstOrderId ? 1 : 0,
    totalFundedUsdc: orders.find((o) => o.id === c.firstOrderId)?.amount ?? 0,
  }));

  return NextResponse.json({
    campaign: CAMPAIGN_ID,
    claimed,
    redeemed,
    totalEscrowFundedUsdc,
    totalCreditConsumedUsdc,
    ogBadgesGranted,
    perWallet,
  });
}
