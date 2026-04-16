/**
 * GET /api/mobile/orders
 *
 * Returns all orders where the authenticated user is buyer or seller.
 * Filter by role with ?role=buyer or ?role=seller (default: both).
 * Filter by status with ?status=pending|funded|accepted|delivered|completed|cancelled
 *
 * NOTE: Escrow transaction _building_ is handled by the existing
 * /api/escrow/build-* endpoints.  This route is read-only for order data.
 *
 * Headers  Authorization: Bearer <token>
 * 200      { data: Order[] }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";

const VALID_STATUSES = ["pending", "funded", "accepted", "delivered", "completed", "cancelled"];

async function handler(req: NextRequest, user: MobileTokenPayload) {
  const role   = req.nextUrl.searchParams.get("role");   // "buyer" | "seller" | null
  const status = req.nextUrl.searchParams.get("status"); // one of VALID_STATUSES | null

  if (status && !VALID_STATUSES.includes(status)) {
    return err(`Invalid status. Valid values: ${VALID_STATUSES.join(", ")}`);
  }

  try {
    const where = {
      ...(role === "buyer"  ? { buyerId: user.sub }
        : role === "seller" ? { sellerId: user.sub }
        : { OR: [{ buyerId: user.sub }, { sellerId: user.sub }] }),
      ...(status ? { status } : {}),
    };

    const orders = await db.order.findMany({
      where,
      select: {
        id: true,
        amount: true,
        status: true,
        escrowAddress: true,
        txHash: true,
        createdAt: true,
        updatedAt: true,
        gig: { select: { id: true, title: true, category: true, deliveryDays: true } },
        buyer:  { select: { id: true, name: true, twitterHandle: true, image: true } },
        seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
        reviews: { select: { id: true, rating: true, body: true, reviewerId: true } },
        offer: { select: { id: true, title: true, amount: true, deliveryDays: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    const enriched = orders.map((o) => ({
      ...o,
      myRole: o.buyer.id === user.sub ? "buyer" : "seller",
      counterpart: o.buyer.id === user.sub ? o.seller : o.buyer,
      myReview: o.reviews.find((r) => r.reviewerId === user.sub) ?? null,
    }));

    return ok(enriched);
  } catch (e) {
    console.error("[mobile/orders]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withMobileAuth(handler);
