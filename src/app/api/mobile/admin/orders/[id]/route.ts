/**
 * PATCH /api/mobile/admin/orders/:id
 *
 * Admin order control — DB-only actions (no on-chain tx).
 * For financial actions that touch the escrow vault, use:
 *   POST /api/mobile/escrow/build-admin-force-release → sync-admin-force-release
 *   POST /api/mobile/escrow/build-admin-refund        → sync-admin-refund
 *
 * Auth: ADMIN or OWNER
 *
 * Body: { action: "cancel" | "freeze" | "unfreeze" | "restore", notes?: string }
 *
 * action values:
 *   cancel   — cancel a pending (never-funded) order; fails on funded/active orders
 *               (those require the on-chain escrow refund flow)
 *   freeze   — lock the order; users cannot advance or cancel; admin reviews
 *   unfreeze — restore to the status stored in frozenFrom metadata
 *   restore  — alias for unfreeze (convenience)
 *
 * 200: { data: { id, status, previousStatus? } }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import { hasMinRole } from "@/lib/rbac";
import { logAdminAction } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

type RouteCtx = { params: Promise<{ id: string }> };

const FUNDED_STATUSES = new Set(["funded", "accepted", "delivered", "disputed"]);

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const caller = await getMobileUser(req);
    if (!caller) return err("Unauthorized", 401);
    if (!hasMinRole(caller.role, "ADMIN")) return err("Admin only.", 403);

    const { id } = await ctx.params;
    const body   = await req.json().catch(() => ({}));
    const { action, notes } = body as { action?: string; notes?: string };

    const VALID = new Set(["cancel", "freeze", "unfreeze", "restore"]);
    if (!action || !VALID.has(action)) {
      return err(`action must be one of: ${[...VALID].join(", ")}.`);
    }

    const order = await db.order.findUnique({
      where: { id },
      select: {
        status: true, buyerId: true, sellerId: true,
        gig: { select: { title: true } },
      },
    });
    if (!order) return err("Order not found.", 404);

    let newStatus: string;
    let meta: Record<string, unknown> = { notes: notes ?? null, actorId: caller.sub };

    if (action === "cancel") {
      if (order.status === "cancelled") return ok({ id, status: "cancelled" });
      if (FUNDED_STATUSES.has(order.status)) {
        return err(
          `Order is "${order.status}" with locked funds. Use the on-chain refund flow ` +
          `(build-admin-refund → sync-admin-refund) to cancel funded orders.`,
          409,
        );
      }
      newStatus = "cancelled";

    } else if (action === "freeze") {
      if (order.status === "frozen") return ok({ id, status: "frozen" });
      meta.frozenFrom = order.status;
      newStatus = "frozen";

    } else {
      // unfreeze / restore
      if (order.status !== "frozen") {
        return err(`Order is "${order.status}", not frozen.`);
      }
      // Restore to previous status if we have it; otherwise fall back to "pending"
      newStatus = (body?.restoreStatus as string) ?? "pending";
      meta.restoredTo = newStatus;
    }

    await db.order.update({ where: { id }, data: { status: newStatus } });

    logAdminAction({
      actorId: caller.sub,
      action:  `order.${action}` as any,
      targetId: id,
      metadata: meta,
    });

    // Notify both parties for impactful actions
    if (action === "cancel" || action === "freeze") {
      const label = action === "cancel" ? "cancelled by admin" : "frozen pending review";
      const title = action === "cancel" ? "Order Cancelled" : "Order Under Review";
      const body  = `Your order "${order.gig.title}" has been ${label}.${notes ? ` Note: ${notes}` : ""}`;

      for (const userId of [order.buyerId, order.sellerId]) {
        await Promise.allSettled([
          notifyUser({ userId, type: "order", title, body, link: `/orders/${id}`, actionUrl: `crewboard://order/${id}` }).catch(() => {}),
          sendPush({ userId, title, body: body.slice(0, 120), data: { type: "order_admin_action", action, orderId: id, actionUrl: `crewboard://order/${id}` } }).catch(() => {}),
        ]);
      }
    }

    return ok({ id, status: newStatus, previousStatus: meta.frozenFrom ?? meta.restoredTo ?? undefined });
  } catch (e: any) {
    if (e?.code === "P2025") return err("Order not found.", 404);
    console.error("[mobile/admin/orders/[id] PATCH]", e);
    return err("Something went wrong.", 500);
  }
}
