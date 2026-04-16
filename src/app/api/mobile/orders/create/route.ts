/**
 * POST /api/mobile/orders/create
 *
 * Creates an order directly from an existing Gig (buyer purchasing a listed service).
 * For orders that come from accepted custom Offers, the order is already created
 * automatically by /api/mobile/offers/respond — do NOT use this endpoint for that.
 *
 * NOTE: This creates the order record in a `pending` state.
 * Escrow funding happens separately via the existing /api/escrow/build-* endpoints.
 *
 * Headers  Authorization: Bearer <token>
 * Body     { gigId: string }
 * 200      { data: { orderId, escrowNote } }
 * 400      { error }
 * 404      { error: "Gig not found." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { notifyUser } from "@/lib/notify";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { gigId } = body as { gigId?: string };

    if (!gigId) return err("gigId is required.");

    const gig = await db.gig.findUnique({
      where: { id: gigId },
      select: { id: true, title: true, price: true, userId: true, status: true },
    });

    if (!gig) return err("Gig not found.", 404);
    if (gig.status !== "active") return err("This gig is not currently available.");
    if (gig.userId === user.sub) return err("You cannot order your own gig.");

    // Check for an existing non-cancelled order between buyer and this gig
    const existing = await db.order.findFirst({
      where: { gigId, buyerId: user.sub, status: { not: "cancelled" } },
      select: { id: true, status: true },
    });
    if (existing) {
      return err(`You already have a ${existing.status} order for this gig.`, 409);
    }

    const order = await db.order.create({
      data: {
        gigId,
        buyerId: user.sub,
        sellerId: gig.userId,
        amount: gig.price,
        status: "pending",
      },
      select: { id: true, amount: true, status: true },
    });

    // Notify seller (fire-and-forget)
    const buyer = await db.user.findUnique({
      where: { id: user.sub },
      select: { name: true, twitterHandle: true },
    });
    const buyerName = buyer?.name ?? buyer?.twitterHandle ?? "Someone";

    notifyUser({
      userId: gig.userId,
      type: "order",
      title: "New Order!",
      body: `${buyerName} placed an order for "${gig.title}".`,
      link: `/orders/${order.id}`,
    }).catch(() => {});

    return ok({
      orderId: order.id,
      amount: order.amount,
      status: order.status,
      escrowNote: "Fund the escrow using /api/escrow/build-fund to start work.",
    });
  } catch (e) {
    console.error("[mobile/orders/create]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
