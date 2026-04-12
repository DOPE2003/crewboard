/**
 * sendMessage — single source of truth for all message creation.
 *
 * Used by:
 *   - src/actions/messages.ts  (server actions / web UI)
 *   - src/app/api/mobile/messages/route.ts  (mobile REST API)
 *
 * Guarantees:
 *   1. Message is always saved to DB (throws if DB fails).
 *   2. Pusher real-time event fired (failure is silenced).
 *   3. In-app notification created for recipient (failure is silenced).
 *   4. Email notification sent if recipient has an email (failure is silenced).
 */

import db from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendMessageNotification } from "@/lib/email";

function msgBodyPreview(body: string, maxLen = 100): string {
  if (body.startsWith("__GIGREQUEST__:")) {
    try { return "Gig Request: " + JSON.parse(body.slice("__GIGREQUEST__:".length)).title; }
    catch { return "Gig Request"; }
  }
  if (body.startsWith("__FILE__:")) {
    try {
      const f = JSON.parse(body.slice("__FILE__:".length));
      if (f.type?.startsWith("image/")) return "Sent an image";
      if (f.type?.startsWith("video/")) return "Sent a video";
      return "Sent a file: " + f.name;
    } catch { return "Sent a file"; }
  }
  return body.slice(0, maxLen) + (body.length > maxLen ? "…" : "");
}

export async function createMessage({
  conversationId,
  senderId,
  body,
  replyToId,
}: {
  conversationId: string;
  senderId: string;
  body: string;
  replyToId?: string | null;
}) {
  // ── 1. Save to DB (hard fail if this throws) ────────────────────────────────
  const message = await db.message.create({
    data: {
      conversationId,
      senderId,
      body: body.trim(),
      ...(replyToId ? { replyToId } : {}),
    },
    select: {
      id: true, senderId: true, body: true, createdAt: true, read: true,
      replyTo: { select: { id: true, senderId: true, body: true } },
    },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // ── 2. Real-time event (non-fatal) ───────────────────────────────────────────
  try {
    await pusher.trigger(`conversation-${conversationId}`, "new-message", message);
  } catch (err) {
    console.warn("[createMessage] Pusher trigger failed (non-fatal):", err);
  }

  // ── 3. In-app notification + email (non-fatal) ───────────────────────────────
  try {
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });

    const recipientId = conv?.participants.find((p) => p !== senderId);
    if (!recipientId) return message;

    const [sender, recipient] = await Promise.all([
      db.user.findUnique({ where: { id: senderId }, select: { name: true, twitterHandle: true } }),
      db.user.findUnique({ where: { id: recipientId }, select: { email: true } }),
    ]);

    const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";
    const preview = msgBodyPreview(body.trim(), 100);

    // In-app notification
    await db.notification.create({
      data: {
        userId: recipientId,
        type: "message",
        title: "New message",
        body: `${senderName}: ${preview}`,
        link: `/messages/${conversationId}`,
      },
    });

    // Email — fire-and-forget so it never blocks the response
    if (recipient?.email) {
      sendMessageNotification({
        to: recipient.email,
        senderName,
        preview,
        conversationId,
      }).catch((err) => {
        console.error("[createMessage] Email notification failed (non-fatal):", err);
      });
    }
  } catch (err) {
    console.error("[createMessage] Notification step failed (non-fatal):", err);
  }

  return message;
}
