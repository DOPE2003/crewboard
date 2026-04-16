/**
 * GET  /api/mobile/notifications          — recent notifications (paginated)
 * POST /api/mobile/notifications          — mark notifications as read
 *
 * GET query params:
 *   ?unreadOnly=true   (default: false)
 *   ?cursor=<notificationId>   (cursor-based pagination)
 *   ?limit=<n>                 (default: 30, max: 50)
 *
 * Firebase handles PUSH delivery.  This endpoint handles the in-app inbox
 * that lives in the DB — the single source of truth.
 *
 * POST body (mark read):
 *   { ids: string[] }     — mark specific notifications read
 *   { all: true }         — mark all unread as read
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser, withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";

// ─── GET ──────────────────────────────────────────────────────────────────────

async function getHandler(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const cursor     = req.nextUrl.searchParams.get("cursor");
  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");
  const limit      = Math.min(Math.max(1, limitParam), 50);

  try {
    // Cursor: find the createdAt of the pivot notification
    let cursorDate: Date | undefined;
    if (cursor) {
      const pivot = await db.notification.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (pivot) cursorDate = pivot.createdAt;
    }

    const notifications = await db.notification.findMany({
      where: {
        userId: user.sub,
        ...(unreadOnly ? { read: false } : {}),
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, type: true, title: true, body: true,
        read: true, link: true, createdAt: true,
      },
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.sub, read: false },
    });

    const nextCursor =
      notifications.length === limit
        ? notifications[notifications.length - 1].id
        : null;

    return ok(notifications, { unreadCount, nextCursor });
  } catch (e) {
    console.error("[mobile/notifications GET]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── POST (mark read) ─────────────────────────────────────────────────────────

async function postHandler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ids, all } = body as { ids?: string[]; all?: boolean };

    if (!all && (!Array.isArray(ids) || ids.length === 0)) {
      return err("Provide ids (string[]) or all: true.");
    }

    if (all) {
      await db.notification.updateMany({
        where: { userId: user.sub, read: false },
        data: { read: true },
      });
      return ok({ marked: "all" });
    }

    // Only mark notifications that belong to this user
    const result = await db.notification.updateMany({
      where: { id: { in: ids }, userId: user.sub },
      data: { read: true },
    });

    return ok({ marked: result.count });
  } catch (e) {
    console.error("[mobile/notifications POST]", e);
    return err("Something went wrong.", 500);
  }
}

export { getHandler as GET };
export const POST = withMobileAuth(postHandler);
