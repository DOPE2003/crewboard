/**
 * GET /api/cron/cancel-expired-orders
 *
 * Called by Vercel Cron every hour.
 * - pending orders not funded within 48 h  → cancelled (no escrow)
 * - funded  orders not accepted within 72 h → flagged for admin refund
 *
 * Set CRON_SECRET in Vercel env and configure Authorization header in vercel.json.
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { notifyUser } from "@/lib/notify";
import { logAdminAction } from "@/lib/audit";

const PENDING_EXPIRY_H  = Number(process.env.ORDER_PENDING_EXPIRY_H  ?? 48);
const FUNDED_EXPIRY_H   = Number(process.env.ORDER_FUNDED_EXPIRY_H   ?? 72);

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  const pendingCutoff = new Date(now.getTime() - PENDING_EXPIRY_H * 60 * 60 * 1000);
  const fundedCutoff  = new Date(now.getTime() - FUNDED_EXPIRY_H  * 60 * 60 * 1000);

  // ── 1. Cancel expired pending orders (no escrow involved) ──────────────────
  const expiredPending = await db.order.findMany({
    where: { status: "pending", createdAt: { lt: pendingCutoff } },
    select: {
      id: true, buyerId: true, sellerId: true,
      gig: { select: { title: true } },
    },
  });

  for (const order of expiredPending) {
    await db.order.update({ where: { id: order.id }, data: { status: "cancelled" } });

    logAdminAction({ actorId: "cron", action: "order.cancelled", targetId: order.id, metadata: { reason: "expired_pending", expiredAfterH: PENDING_EXPIRY_H } });

    notifyUser({
      userId: order.buyerId,
      type: "order",
      title: "Order Cancelled",
      body: `Your order for "${order.gig.title}" was cancelled — the seller didn't respond within ${PENDING_EXPIRY_H} hours.`,
      link: `/orders/${order.id}`,
      actionUrl: `crewboard://order/${order.id}`,
    }).catch(() => {});

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Order Expired",
      body: `An order for "${order.gig.title}" was cancelled because it wasn't accepted within ${PENDING_EXPIRY_H} hours.`,
      link: `/orders/${order.id}`,
      actionUrl: `crewboard://order/${order.id}`,
    }).catch(() => {});
  }

  // ── 2. Flag funded orders stuck without acceptance ──────────────────────────
  // Cannot auto-refund on-chain from a cron (no wallet signer).
  // Instead: log for admin review + notify both parties.
  const expiredFunded = await db.order.findMany({
    where: { status: "funded", updatedAt: { lt: fundedCutoff } },
    select: {
      id: true, buyerId: true, sellerId: true,
      gig: { select: { title: true } },
    },
  });

  for (const order of expiredFunded) {
    logAdminAction({ actorId: "cron", action: "order.stale_funded", targetId: order.id, metadata: { expiredAfterH: FUNDED_EXPIRY_H } });

    notifyUser({
      userId: order.buyerId,
      type: "order",
      title: "Order Needs Attention",
      body: `Your funded order for "${order.gig.title}" hasn't been accepted in ${FUNDED_EXPIRY_H} hours. You can raise a dispute to recover your funds.`,
      link: `/orders/${order.id}`,
      actionUrl: `crewboard://order/${order.id}`,
    }).catch(() => {});

    notifyUser({
      userId: order.sellerId,
      type: "order",
      title: "Order Awaiting Your Response",
      body: `An order for "${order.gig.title}" has been waiting ${FUNDED_EXPIRY_H} hours for your acceptance. Accept it or the buyer may raise a dispute.`,
      link: `/orders/${order.id}`,
      actionUrl: `crewboard://order/${order.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    cancelledPending: expiredPending.length,
    flaggedFunded: expiredFunded.length,
    at: now.toISOString(),
  });
}
