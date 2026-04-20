/**
 * createMessage — single source of truth for all message creation.
 *
 * Used by:
 *   - src/actions/messages.ts  (server actions / web UI)
 *   - src/app/api/mobile/messages/route.ts  (mobile REST API)
 *
 * Guarantees:
 *   1. Message is always saved to DB (hard fail if this throws).
 *   2. Pusher real-time event fired (failure is logged, non-fatal).
 *   3. In-app notification created for recipient (failure is logged, non-fatal).
 *   4. Email notification sent if recipient has an email (failure is logged, non-fatal).
 */

import db from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { sendMessageNotification } from "@/lib/email";
import { sendPush } from "@/lib/push";

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

  console.log(`[createMessage] message ${message.id} saved (conv: ${conversationId}, sender: ${senderId})`);

  // ── 2. Real-time event (non-fatal) ───────────────────────────────────────────
  try {
    await pusher.trigger(`conversation-${conversationId}`, "new-message", message);
    console.log(`[createMessage] Pusher triggered for conv: ${conversationId}`);
  } catch (err) {
    console.error("[createMessage] Pusher trigger failed:", err);
  }

  // ── 3. In-app notification + email (non-fatal) ───────────────────────────────
  try {
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });

    const recipientId = conv?.participants.find((p) => p !== senderId);
    if (!recipientId || recipientId === senderId) {
      console.warn("[createMessage] No valid recipient found — skipping notification");
      return message;
    }

    console.log(`[createMessage] Recipient id: ${recipientId}`);

    const [sender, recipient] = await Promise.all([
      db.user.findUnique({ where: { id: senderId }, select: { name: true, twitterHandle: true, image: true } }),
      db.user.findUnique({ where: { id: recipientId }, select: { email: true } }),
    ]);

    const senderName  = sender?.name ?? sender?.twitterHandle ?? "Someone";
    const senderImage = sender?.image ?? null;
    const preview     = msgBodyPreview(body.trim(), 100);

    // In-app notification — messageId dedupes against the unique(userId, messageId) constraint
    try {
      await db.notification.create({
        data: {
          userId: recipientId,
          type: "message",
          title: senderName,
          body: preview,
          link: `/messages/${conversationId}`,
          actionUrl: `crewboard://chat/${conversationId}`,
          messageId: message.id,
          ...(senderImage ? { senderImage } : {}),
        },
      });
      console.log(`[createMessage] In-app notification created for ${recipientId}`);
    } catch (e: any) {
      if (e?.code === "P2002") {
        console.log(`[createMessage] Notification deduped (already exists) for message ${message.id}`);
      } else { throw e; }
    }

    // FCM push for mobile users (fire-and-forget)
    sendPush({
      userId: recipientId,
      title: senderName,
      body: preview.slice(0, 120),
      data: {
        type: "message",
        actionUrl: `crewboard://chat/${conversationId}`,
      },
    }).catch(() => {});

    // Email
    const recipientEmail = recipient?.email ?? null;
    if (!recipientEmail) {
      console.warn(`[createMessage] NO EMAIL FOR USER ${recipientId} — skipping email notification`);
    } else {
      console.log(`[createMessage] Sending email notification to ${recipientEmail}`);
      sendMessageNotification({
        to: recipientEmail,
        senderName,
        preview,
        conversationId,
      }).catch((err) => {
        console.error("[createMessage] sendMessageNotification threw (non-fatal):", err);
      });
    }
  } catch (err) {
    console.error("[createMessage] Notification step failed (non-fatal):", err);
  }

  return message;
}
