/**
 * POST /api/mobile/orders/status
 *
 * DB-only order status transitions — no on-chain tx required.
 * Used for: accept, delivered (after mark-delivered tx), dispute, cancel.
 *
 * Permission rules (mirror src/actions/orders.ts):
 *   accepted  — seller only, from [funded]
 *   delivered — seller only, from [accepted]   (call AFTER build-mark-delivered tx confirms)
 *   cancelled — buyer or seller, from [pending]
 *   disputed  — buyer or seller, from [accepted, funded, delivered]
 *
 * Auth:  Bearer <mobile JWT>
 *
 * Body:  { orderId: string; status: "accepted"|"delivered"|"cancelled"|"disputed" }
 *
 * 200:  { data: { orderId, status } }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { notifyUser } from "@/lib/notify";

const RULES: Record<string, { by: "buyer" | "seller" | "both"; from: string[] }> = {
  accepted:           { by: "seller", from: ["funded"] },
  delivered:          { by: "seller", from: ["funded", "revision_requested"] },
  cancelled:          { by: "both",   from: ["pending"] },
  disputed:           { by: "both",   from: ["accepted", "funded", "delivered"] },
  revision_requested: { by: "buyer",  from: ["delivered"] },
};

const NOTIFY_LABELS: Record<string, string> = {
  accepted:           "accepted the order",
  delivered:          "marked the order as delivered",
  cancelled:          "cancelled the order",
  disputed:           "opened a dispute",
  revision_requested: "requested a revision",
};

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, status } = body as { orderId?: string; status?: string };

    if (!orderId) return err("orderId is required.");
    if (!status)  return err("status is required.");
    if (!RULES[status]) {
      return err(`Invalid status. Allowed: ${Object.keys(RULES).join(", ")}.`);
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        buyerId: true, sellerId: true, status: true,
        gig: { select: { title: true } },
      },
    });

    if (!order) return err("Order not found.", 404);

    const isBuyer  = order.buyerId  === user.sub;
    const isSeller = order.sellerId === user.sub;
    if (!isBuyer && !isSeller) return err("You are not a participant in this order.", 403);

    const rule = RULES[status];
    if (!rule.from.includes(order.status)) {
      return err(`Cannot move from "${order.status}" to "${status}".`);
    }
    if (rule.by === "seller" && !isSeller) return err("Only the seller can do this.", 403);
    if (rule.by === "buyer"  && !isBuyer)  return err("Only the buyer can do this.", 403);

    if (status === "revision_requested") {
      const note = ((body as Record<string, unknown>).note as string | undefined)?.trim() ?? "";
      if (note) {
        const current = await db.order.findUnique({
          where: { id: orderId },
          select: { revisionRequests: true },
        });
        const requests = (current?.revisionRequests as unknown[]) ?? [];
        await db.order.update({
          where: { id: orderId },
          data: {
            status,
            revisionCount: { increment: 1 },
            revisionRequests: [...requests, { requestedAt: new Date().toISOString(), note }] as object[],
          },
        });
      } else {
        await db.order.update({ where: { id: orderId }, data: { status } });
      }
    } else {
      await db.order.update({ where: { id: orderId }, data: { status } });
    }

    // Notify the other party
    const notifyId = isBuyer ? order.sellerId : order.buyerId;
    const actor = await db.user.findUnique({
      where: { id: user.sub },
      select: { name: true, twitterHandle: true },
    });
    const actorName = actor?.name ?? actor?.twitterHandle ?? "Someone";
    const revisionNote = status === "revision_requested"
      ? ((body as Record<string, unknown>).note as string | undefined)?.trim() ?? ""
      : "";
    const notifyBody = revisionNote
      ? `${actorName} ${NOTIFY_LABELS[status]} — ${order.gig.title}: "${revisionNote}"`
      : `${actorName} ${NOTIFY_LABELS[status]} — ${order.gig.title}`;

    notifyUser({
      userId: notifyId,
      type: "order",
      title: "Order Update",
      body: notifyBody,
      link: `/orders/${orderId}`,
      actionUrl: `crewboard://order/${orderId}`,
    }).catch(() => {});

    return ok({ orderId, status });
  } catch (e) {
    console.error("[mobile/orders/status]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
