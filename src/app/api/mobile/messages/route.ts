/**
 * GET  /api/mobile/messages?conversationId=<id>&before=<messageId>
 * POST /api/mobile/messages
 *
 * GET: Returns up to 50 messages in a conversation, oldest-first.
 *   Use `before` (message id) for cursor-based pagination (scroll-up / load more).
 *   All special message types are parsed — iOS never sees raw `__OFFER__:` strings.
 *
 * POST: Send a plain-text message (or attach a pre-uploaded file URL).
 *   Triggers Pusher for real-time delivery + notifies receiver.
 *
 * Headers  Authorization: Bearer <token>
 * Body (POST) {
 *   conversationId: string;
 *   body: string;         // plain text OR serialised file/offer prefix (advanced)
 *   replyToId?: string;   // id of message being replied to
 * }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser, withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { parseMessageBody } from "../_lib/parse-message";
import { notifyUser } from "@/lib/notify";

// ─── GET ──────────────────────────────────────────────────────────────────────

async function getHandler(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) return err("conversationId is required.");

  const before = req.nextUrl.searchParams.get("before"); // message id cursor

  try {
    // Verify the user is a participant
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });
    if (!conv || !conv.participants.includes(user.sub)) {
      return err("Conversation not found.", 404);
    }

    // Cursor: find the createdAt of the `before` message
    let beforeDate: Date | undefined;
    if (before) {
      const pivot = await db.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (pivot) beforeDate = pivot.createdAt;
    }

    const rows = await db.message.findMany({
      where: {
        conversationId,
        ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
      },
      orderBy: { createdAt: "desc" }, // fetch newest-first, reverse below
      take: 50,
      select: {
        id: true, senderId: true, body: true, createdAt: true, read: true,
        replyTo: {
          select: {
            id: true, senderId: true, body: true,
            sender: { select: { name: true, twitterHandle: true } },
          },
        },
        sender: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    });

    // Mark unread messages as read (fire-and-forget)
    const unreadIds = rows
      .filter((m) => !m.read && m.senderId !== user.sub)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      db.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true },
      }).catch(() => {});
    }

    const messages = rows.reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      sentByMe: m.senderId === user.sub,
      sender: m.sender,
      content: parseMessageBody(m.body),
      replyTo: m.replyTo
        ? {
            id: m.replyTo.id,
            senderId: m.replyTo.senderId,
            senderName: m.replyTo.sender?.name ?? m.replyTo.sender?.twitterHandle ?? null,
            content: parseMessageBody(m.replyTo.body),
          }
        : null,
      read: m.read,
      sentAt: m.createdAt,
    }));

    const nextCursor = rows.length === 50 ? rows[0].id : null;

    return ok(messages, { nextCursor });
  } catch (e) {
    console.error("[mobile/messages GET]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function postHandler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { conversationId, body: msgBody, replyToId } = body as {
      conversationId?: string;
      body?: string;
      replyToId?: string;
    };

    if (!conversationId) return err("conversationId is required.");
    if (!msgBody?.trim())  return err("body cannot be empty.");

    // Verify participant
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });
    if (!conv || !conv.participants.includes(user.sub)) {
      return err("Conversation not found.", 404);
    }

    // Verify replyToId belongs to this conversation
    if (replyToId) {
      const replyMsg = await db.message.findUnique({
        where: { id: replyToId },
        select: { conversationId: true },
      });
      if (!replyMsg || replyMsg.conversationId !== conversationId) {
        return err("Invalid replyToId.");
      }
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: user.sub,
        body: msgBody.trim(),
        ...(replyToId ? { replyToId } : {}),
      },
      select: {
        id: true, senderId: true, body: true, createdAt: true, read: true,
        replyTo: {
          select: {
            id: true, senderId: true, body: true,
            sender: { select: { name: true, twitterHandle: true } },
          },
        },
      },
    });

    // Update conversation timestamp
    db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }).catch(() => {});

    // Notify the other participant (fire-and-forget)
    const receiverId = conv.participants.find((p) => p !== user.sub);
    if (receiverId) {
      const sender = await db.user.findUnique({
        where: { id: user.sub },
        select: { name: true, twitterHandle: true },
      });
      const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";

      notifyUser({
        userId: receiverId,
        type: "message",
        title: `New message from ${senderName}`,
        body: parseMessageBody(msgBody).type === "text"
          ? msgBody.slice(0, 100)
          : "Sent you a file",
        link: `/messages/${conversationId}`,
      }).catch(() => {});
    }

    // Pusher real-time delivery (same pattern as web)
    try {
      const Pusher = (await import("pusher")).default;
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        useTLS: true,
      });
      await pusher.trigger(`conversation-${conversationId}`, "new-message", {
        ...message,
        replyTo: message.replyTo ?? null,
      });
    } catch { /* Pusher failure must not fail the request */ }

    return ok({
      id: message.id,
      senderId: message.senderId,
      sentByMe: true,
      content: parseMessageBody(message.body),
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            senderId: message.replyTo.senderId,
            senderName: message.replyTo.sender?.name ?? message.replyTo.sender?.twitterHandle ?? null,
            content: parseMessageBody(message.replyTo.body),
          }
        : null,
      read: message.read,
      sentAt: message.createdAt,
    });
  } catch (e) {
    console.error("[mobile/messages POST]", e);
    return err("Something went wrong.", 500);
  }
}

export { getHandler as GET };
export const POST = withMobileAuth(postHandler);
