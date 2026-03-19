"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { containsSocial } from "@/lib/filterSocials";
import { revalidatePath } from "next/cache";
import { sendMessageNotification, sendHireNotification, sendServiceRequestNotification } from "@/lib/email";

export async function sendMessage(conversationId: string, body: string, replyToId?: string) {
  // Top-level catch ensures Next.js always gets a serialisable Error back
  // instead of the generic "An unexpected response was received from the server."
  try {
    return await _sendMessage(conversationId, body, replyToId);
  } catch (err: any) {
    // Re-throw special Next.js errors (redirect, notFound) as-is
    if (err?.digest) throw err;
    console.error("[sendMessage] error:", err?.constructor?.name, err?.message);
    throw new Error(err?.message ?? String(err) ?? "Failed to send message");
  }
}

async function _sendMessage(conversationId: string, body: string, replyToId?: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) {
    console.error("[sendMessage] Unauthorized — session:", JSON.stringify(session?.user));
    throw new Error("Unauthorized — please sign out and sign back in");
  }

  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { participants: true },
  });

  if (!conv || !conv.participants.includes(userId)) {
    console.error("[sendMessage] Conversation not found — convId:", conversationId, "userId:", userId, "participants:", conv?.participants);
    throw new Error("Conversation not found");
  }

  if (containsSocial(body)) {
    throw new Error("Messages cannot contain social handles, emails, phone numbers, or links. Keep all contact on Crewboard.");
  }

  let message;
  try {
    message = await db.message.create({
      data: { conversationId, senderId: userId, body: body.trim(), ...(replyToId ? { replyToId } : {}) },
      select: {
        id: true, senderId: true, body: true, createdAt: true, read: true,
        replyTo: { select: { id: true, senderId: true, body: true } },
      },
    });
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  } catch (dbErr: any) {
    console.error("[sendMessage] DB error:", dbErr?.message, dbErr?.code);
    throw new Error(dbErr?.message ?? "Database error");
  }

  revalidatePath("/messages", "layout");

  try { await pusher.trigger(`conversation-${conversationId}`, "new-message", message); } catch {}

  const recipientId = conv.participants.find((p) => p !== userId);
  if (recipientId) {
    try {
      const [sender, recipient] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, select: { name: true, twitterHandle: true } }),
        db.user.findUnique({ where: { id: recipientId }, select: { email: true } }),
      ]);
      const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";
      const preview = body.trim().slice(0, 100);
      await db.notification.create({
        data: {
          userId: recipientId,
          type: "message",
          title: "New message",
          body: `${senderName}: ${preview}`,
          link: `/messages/${conversationId}`,
        },
      });
      // Email notification (only if recipient has email)
      if (recipient?.email) {
        sendMessageNotification({
          to: recipient.email,
          senderName,
          preview,
          conversationId,
        }).catch(() => {});
      }
    } catch {}
  }

  return JSON.parse(JSON.stringify(message));
}

export async function markMessagesAsRead(conversationId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return;

  await db.message.updateMany({
    where: { conversationId, read: false, senderId: { not: userId } },
    data: { read: true },
  });
  revalidatePath("/messages", "layout");
}

export async function markAllConversationsRead() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return;

  const convs = await db.conversation.findMany({
    where: { participants: { has: userId } },
    select: { id: true },
  });
  const convIds = convs.map((c) => c.id);
  if (convIds.length === 0) return;

  await db.message.updateMany({
    where: { conversationId: { in: convIds }, read: false, senderId: { not: userId } },
    data: { read: true },
  });
  revalidatePath("/messages", "layout");
}

export async function getMessages(conversationId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Unauthorized");

  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { participants: true },
  });
  if (!conv || !conv.participants.includes(userId)) {
    throw new Error("Conversation not found");
  }

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, senderId: true, body: true, createdAt: true, read: true,
      replyTo: { select: { id: true, senderId: true, body: true } },
    },
  });

  return JSON.parse(JSON.stringify(messages)); // Ensure plain object for client components
}

export async function startConversation(recipientId: string): Promise<{ redirectTo: string }> {
  try {
    const session = await auth();
    const senderId = (session?.user as any)?.userId as string | undefined;
    if (!senderId) return { redirectTo: "/login" };

    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: senderId } },
          { participants: { has: recipientId } },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return { redirectTo: `/messages/${existing.id}` };
    } else {
      const conv = await db.conversation.create({
        data: { participants: [senderId, recipientId] },
        select: { id: true },
      });
      return { redirectTo: `/messages/${conv.id}` };
    }
  } catch (err: any) {
    if (err?.digest) throw err;
    console.error("[startConversation]", err?.constructor?.name, err?.message);
    throw new Error(err?.message ?? "Failed to start conversation");
  }
}

// Shared helper — find or create conversation and optionally send an opening message
async function getOrCreateConversation(senderId: string, recipientId: string) {
  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { has: senderId } },
        { participants: { has: recipientId } },
      ],
    },
    select: { id: true },
  });
  if (existing) return existing.id;
  const conv = await db.conversation.create({
    data: { participants: [senderId, recipientId] },
    select: { id: true },
  });
  return conv.id;
}

async function sendAutoMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  body: string,
  emailType: "hire" | "gig" = "hire",
  gigTitle?: string,
) {
  const message = await db.message.create({
    data: { conversationId, senderId, body },
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });
  await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  try { await pusher.trigger(`conversation-${conversationId}`, "new-message", message); } catch {}

  try {
    const [sender, recipient] = await Promise.all([
      db.user.findUnique({ where: { id: senderId }, select: { name: true, twitterHandle: true } }),
      db.user.findUnique({ where: { id: recipientId }, select: { email: true } }),
    ]);
    const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";

    await db.notification.create({
      data: {
        userId: recipientId,
        type: "message",
        title: emailType === "gig" ? "Your service is wanted" : "New hire request",
        body: `${senderName}: ${body.slice(0, 60)}`,
        link: `/messages/${conversationId}`,
      },
    });

    if (recipient?.email) {
      if (emailType === "gig" && gigTitle) {
        sendServiceRequestNotification({ to: recipient.email, buyerName: senderName, gigTitle, conversationId }).catch(() => {});
      } else {
        sendHireNotification({ to: recipient.email, buyerName: senderName, conversationId }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[sendAutoMessage] notification/email failed (non-fatal):", err);
  }
}

export async function hireFromProfile(recipientId: string): Promise<{ redirectTo: string }> {
  try {
    const session = await auth();
    const senderId = (session?.user as any)?.userId as string | undefined;
    if (!senderId) return { redirectTo: "/login" };

    const convId = await getOrCreateConversation(senderId, recipientId);
    await sendAutoMessage(convId, senderId, recipientId, "Hi! I want to hire you. Can we discuss the details?");
    return { redirectTo: `/messages/${convId}` };
  } catch (err: any) {
    if (err?.digest) throw err;
    console.error("[hireFromProfile]", err?.constructor?.name, err?.message);
    throw new Error(err?.message ?? "Failed to send hire request");
  }
}

export async function hireFromGig(gigId: string, sellerId: string): Promise<{ redirectTo: string }> {
  try {
    const session = await auth();
    const senderId = (session?.user as any)?.userId as string | undefined;
    if (!senderId) return { redirectTo: "/login" };

    const gig = await db.gig.findUnique({
      where: { id: gigId },
      select: { title: true, price: true, deliveryDays: true },
    });
    if (!gig) return { redirectTo: "/gigs" };

    const order = await db.order.create({
      data: { gigId, buyerId: senderId, sellerId, amount: gig.price, status: "pending" },
      select: { id: true },
    });

    const convId = await getOrCreateConversation(senderId, sellerId);
    const body = `__GIGREQUEST__:${JSON.stringify({ id: gigId, orderId: order.id, title: gig.title, price: gig.price, days: gig.deliveryDays })}`;
    await sendAutoMessage(convId, senderId, sellerId, body, "gig", gig.title);
    return { redirectTo: `/orders/${order.id}` };
  } catch (err: any) {
    if (err?.digest) throw err;
    console.error("[hireFromGig]", err?.constructor?.name, err?.message);
    throw new Error(err?.message ?? "Failed to create order");
  }
}
