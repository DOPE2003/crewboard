/**
 * GET /api/mobile/orders/:id
 *
 * Returns a single order by id. Caller must be buyer or seller.
 *
 * Auth: Bearer <mobile JWT>
 * 200: { data: Order }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { maskDelivery } from "../../_lib/mask-delivery";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        status: true,
        escrowAddress: true,
        txHash: true,
        createdAt: true,
        updatedAt: true,
        deliveryNote: true,
        deliveryFiles: true,
        deliverySubmittedAt: true,
        deliveryHistory: true,
        revisionRequests: true,
        revisionCount: true,
        gig:     { select: { id: true, title: true, category: true, deliveryDays: true } },
        buyer:   { select: { id: true, name: true, twitterHandle: true, image: true } },
        seller:  { select: { id: true, name: true, twitterHandle: true, image: true } },
        reviews: { select: { id: true, rating: true, body: true, reviewerId: true } },
        offer:   { select: { id: true, title: true, amount: true, deliveryDays: true } },
      },
    });

    if (!order) return err("Order not found.", 404);
    if (order.buyer.id !== user.sub && order.seller.id !== user.sub)
      return err("You are not a participant in this order.", 403);

    return ok(maskDelivery({
      ...order,
      myRole:      order.buyer.id === user.sub ? "buyer" : "seller",
      counterpart: order.buyer.id === user.sub ? order.seller : order.buyer,
      myReview:    order.reviews.find((r) => r.reviewerId === user.sub) ?? null,
    }));
  } catch (e) {
    console.error("[mobile/orders/:id]", e);
    return err("Something went wrong.", 500);
  }
}
