/**
 * GET /api/mobile/admin/disputes
 * All disputes across the platform (not limited to caller's orders).
 * Auth: SUPPORT or above
 * Query: status, cursor, limit
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withSupportAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

const DISPUTE_INCLUDE = {
  evidence: true,
  messages: {
    orderBy: { createdAt: "asc" as const },
    take: 5,
    include: {
      sender: { select: { id: true, name: true, twitterHandle: true, image: true } },
    },
  },
  order: {
    select: {
      txHash: true, amount: true, escrowAddress: true,
      buyerId: true, sellerId: true,
      buyer:  { select: { name: true, twitterHandle: true, image: true } },
      seller: { select: { name: true, twitterHandle: true, image: true } },
      gig:    { select: { title: true } },
    },
  },
} as const;

async function handler(req: NextRequest, _user: MobileTokenPayload) {
  try {
    const sp     = req.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const cursor = sp.get("cursor") ?? undefined;
    const limit  = Math.min(Number(sp.get("limit") ?? 30), 100);

    const disputes = await db.dispute.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: DISPUTE_INCLUDE,
    });

    const hasMore    = disputes.length > limit;
    const page       = hasMore ? disputes.slice(0, limit) : disputes;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    const data = page.map((d) => {
      const o = d.order;
      return {
        id: d.id, status: d.status, reason: d.reason, description: d.description,
        resolution: d.resolution ?? null, resolvedAt: d.resolvedAt ?? null,
        createdAt: d.createdAt, updatedAt: d.updatedAt,
        filedById: d.filedById,
        jobId: d.orderId, jobTitle: o.gig.title,
        amountLamports: o.amount, escrowAddress: o.escrowAddress ?? null,
        clientUID: o.buyerId, clientName: o.buyer.name ?? o.buyer.twitterHandle,
        freelancerUID: o.sellerId, freelancerName: o.seller.name ?? o.seller.twitterHandle,
        evidence: d.evidence, messages: d.messages,
      };
    });

    return ok({ data, meta: { nextCursor } });
  } catch (e) {
    console.error("[mobile/admin/disputes]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withSupportAuth(handler);
