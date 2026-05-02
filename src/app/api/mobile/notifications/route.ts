/**
 * GET  /api/mobile/notifications          — recent notifications (paginated, max 30 days old)
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
import { withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";

const RETENTION_DAYS = 30;
const RETENTION_MS   = RETENTION_DAYS * 24 * 60 * 60 * 1000;

// ─── GET ──────────────────────────────────────────────────────────────────────

async function getHandler(req: NextRequest, user: MobileTokenPayload) {
  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const cursor     = req.nextUrl.searchParams.get("cursor");
  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");
  const limit      = Math.min(Math.max(1, limitParam), 50);

  const cutoff = new Date(Date.now() - RETENTION_MS);

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
        userId:    user.sub,
        createdAt: { gte: cutoff, ...(cursorDate ? { lt: cursorDate } : {}) },
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, type: true, title: true, body: true,
        read: true, link: true, actionUrl: true, senderImage: true, createdAt: true,
      },
    });

    // Derive actionUrl from link for message notifications that predate the actionUrl field
    const enriched = notifications.map((n) => {
      if (n.type === "message" && !n.actionUrl && n.link) {
        const convId = n.link.split("/messages/")[1];
        return { ...n, actionUrl: convId ? `crewboard://chat/${convId}` : null };
      }
      return n;
    });

    const unreadCount = await db.notification.count({
      where: { userId: user.sub, read: false, createdAt: { gte: cutoff } },
    });

    const nextCursor =
      enriched.length === limit ? enriched[enriched.length - 1].id : null;

    // Prune notifications older than 30 days for this user (fire-and-forget)
    db.notification.deleteMany({
      where: { userId: user.sub, createdAt: { lt: cutoff } },
    }).catch(() => {});

    return ok(enriched, { unreadCount, nextCursor });
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

export const GET  = withMobileAuth(getHandler);
export const POST = withMobileAuth(postHandler);
