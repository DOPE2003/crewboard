/**
 * GET /api/mobile/admin/orders
 *
 * Paginated list of ALL orders across the platform.
 * Auth: SUPPORT or above
 *
 * Query:
 *   status   — filter by order status (pending|funded|accepted|delivered|completed|cancelled|disputed|frozen)
 *   cursor   — last order id for pagination
 *   limit    — max results (default 30, max 100)
 *   search   — buyer/seller handle or gig title contains
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withSupportAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, _user: MobileTokenPayload) {
  try {
    const sp     = req.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const cursor = sp.get("cursor") ?? undefined;
    const search = sp.get("search")?.trim() ?? "";
    const limit  = Math.min(Number(sp.get("limit") ?? 30), 100);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { buyer:  { twitterHandle: { contains: search, mode: "insensitive" } } },
        { seller: { twitterHandle: { contains: search, mode: "insensitive" } } },
        { buyer:  { name:          { contains: search, mode: "insensitive" } } },
        { seller: { name:          { contains: search, mode: "insensitive" } } },
        { gig:    { title:         { contains: search, mode: "insensitive" } } },
      ];
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, amount: true, status: true,
        escrowAddress: true, txHash: true,
        createdAt: true, updatedAt: true,
        gig:    { select: { id: true, title: true, category: true } },
        buyer:  { select: { id: true, name: true, twitterHandle: true, image: true } },
        seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
        disputes: { select: { id: true, status: true, reason: true }, take: 1 },
        offer:  { select: { id: true, amount: true } },
      },
    });

    const hasMore    = orders.length > limit;
    const page       = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return ok({ data: page, meta: { nextCursor } });
  } catch (e) {
    console.error("[mobile/admin/orders GET]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withSupportAuth(handler);
