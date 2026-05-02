/**
 * GET /api/mobile/admin/users
 * Auth: ADMIN or OWNER
 * Query: page, limit, search, role
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withAdminAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, _user: MobileTokenPayload) {
  try {
    const sp     = req.nextUrl.searchParams;
    const page   = Math.max(1, parseInt(sp.get("page")  ?? "1",  10));
    const limit  = Math.min(50, parseInt(sp.get("limit") ?? "20", 10));
    const search = sp.get("search")?.trim() ?? "";
    const role   = sp.get("role")?.toUpperCase() ?? "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name:          { contains: search, mode: "insensitive" } },
        { twitterHandle: { contains: search, mode: "insensitive" } },
        { email:         { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, twitterHandle: true, image: true,
          email: true, role: true, profileComplete: true,
          isOG: true, humanVerified: true, createdAt: true, lastSeenAt: true,
          _count: { select: { gigs: true, buyerOrders: true, sellerOrders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return ok(users, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("[mobile/admin/users]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withAdminAuth(handler);
