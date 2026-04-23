"use server";

import { auth } from "@/auth";

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
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendHireNotification, sendServiceRequestNotification } from "@/lib/email";
import { createMessage } from "@/lib/sendMessage";

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

  let message;
  try {
    message = await createMessage({ conversationId, senderId: userId, body, replyToId });
  } catch (dbErr: any) {
    console.error("[sendMessage] DB error:", dbErr?.message, dbErr?.code);
    throw new Error(dbErr?.message ?? "Database error");
  }

  revalidatePath("/messages", "layout");

  return JSON.parse(JSON.stringify(message));
}

export async function markMessagesAsRead(conversationId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return;

  await db.$transaction([
    db.message.updateMany({
      where: { conversationId, read: false, senderId: { not: userId } },
      data: { read: true },
    }),
    // Sync notification read-state — prevents ghost unreads in the bell
    db.notification.updateMany({
      where: {
        userId,
        type: "message",
        read: false,
        link: { contains: `/messages/${conversationId}` },
      },
      data: { read: true },
    }),
  ]);
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
      // Only redirect to existing conv if it has at least one message
      include: { messages: { take: 1, select: { id: true } } },
    });

    if (existing && existing.messages.length > 0) {
      return { redirectTo: `/messages/${existing.id}` };
    }

    // No conversation yet (or existing empty one) — go to new-conversation flow
    // This prevents creating empty threads in the DB
    return { redirectTo: `/messages/new?with=${recipientId}` };
  } catch (err: any) {
    if (err?.digest) throw err;
    console.error("[startConversation]", err?.constructor?.name, err?.message);
    throw new Error(err?.message ?? "Failed to start conversation");
  }
}

// Creates conversation + sends first message atomically (no empty threads)
export async function sendFirstMessage(
  recipientId: string,
  body: string,
): Promise<{ conversationId: string }> {
  try {
    const session = await auth();
    const senderId = (session?.user as any)?.userId as string | undefined;
    if (!senderId) throw new Error("Unauthorized");
    if (!body.trim()) throw new Error("Message cannot be empty");

    const participantKey = [senderId, recipientId].sort().join(":");

    const existing = await db.conversation.findUnique({
      where: { participantKey },
      select: { id: true },
    });

    const conversationId = existing?.id ?? (await db.conversation.create({
      data: { participants: [senderId, recipientId], participantKey },
      select: { id: true },
    })).id;

    await _sendMessage(conversationId, body.trim());
    return { conversationId };
  } catch (err: any) {
    if (err?.digest) throw err;
    console.error("[sendFirstMessage]", err?.constructor?.name, err?.message);
    throw new Error(err?.message ?? "Failed to send");
  }
}

// Deletes empty conversations (no messages) older than 1h for the current user
export async function cleanupEmptyConversations(): Promise<void> {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.userId as string | undefined;
    if (!userId) return;

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const empty = await db.conversation.findMany({
      where: {
        participants: { has: userId },
        messages: { none: {} },
        createdAt: { lt: hourAgo },
      },
      select: { id: true },
    });

    if (empty.length > 0) {
      await db.conversation.deleteMany({
        where: { id: { in: empty.map((c) => c.id) } },
      });
    }
  } catch {}
}

// Shared helper — find or create conversation and optionally send an opening message
async function getOrCreateConversation(senderId: string, recipientId: string) {
  const participantKey = [senderId, recipientId].sort().join(":");
  const existing = await db.conversation.findUnique({
    where: { participantKey },
    select: { id: true },
  });
  if (existing) return existing.id;
  const conv = await db.conversation.create({
    data: { participants: [senderId, recipientId], participantKey },
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
  // createMessage handles DB save + Pusher + in-app notification + message email.
  // sendAutoMessage adds the hire/gig-specific email on top.
  await createMessage({ conversationId, senderId, body });

  try {
    const [sender, recipient] = await Promise.all([
      db.user.findUnique({ where: { id: senderId }, select: { name: true, twitterHandle: true } }),
      db.user.findUnique({ where: { id: recipientId }, select: { email: true } }),
    ]);
    const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";

    if (recipient?.email) {
      if (emailType === "gig" && gigTitle) {
        sendServiceRequestNotification({ to: recipient.email, buyerName: senderName, gigTitle, conversationId }).catch(() => {});
      } else {
        sendHireNotification({ to: recipient.email, buyerName: senderName, conversationId }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[sendAutoMessage] hire/gig email failed (non-fatal):", err);
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

export async function deleteConversation(conversationId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { ok: false };

  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { participants: true },
  });
  if (!conv || !conv.participants.includes(userId)) return { ok: false };

  // Always hard-delete the whole row (and cascade messages/offers).
  // Mutating participants to remove one user corrupts the array and causes
  // "Conversation not found" 404s for the other participant on all platforms.
  await db.conversation.delete({ where: { id: conversationId } });

  revalidatePath("/messages", "layout");
  return { ok: true };
}
