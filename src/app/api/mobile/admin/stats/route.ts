/**
 * GET /api/mobile/admin/stats
 * Auth: ADMIN or OWNER
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withAdminAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(_req: NextRequest, _user: MobileTokenPayload) {
  try {
    const [
      totalUsers, activeGigs, totalOrders, completedOrders,
      pendingDisputes, revenue,
    ] = await Promise.all([
      db.user.count(),
      db.gig.count({ where: { status: "active" } }),
      db.order.count(),
      db.order.count({ where: { status: "completed" } }),
      db.dispute.count({ where: { status: { in: ["open", "under_review", "escalated"] } } }),
      db.order.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    ]);

    return ok({
      totalUsers,
      activeGigs,
      totalOrders,
      completedOrders,
      pendingDisputes,
      totalRevenueLamports: revenue._sum.amount ?? 0,
    });
  } catch (e) {
    console.error("[mobile/admin/stats]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withAdminAuth(handler);
