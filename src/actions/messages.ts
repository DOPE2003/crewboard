"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { pusher } from "@/lib/pusher";
import { revalidatePath } from "next/cache";
import { containsSocial } from "@/lib/filterSocials";

export async function sendMessage(conversationId: string, body: string) {
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

  if (containsSocial(body)) {
    throw new Error("Messages cannot contain social handles, emails, phone numbers, or links. Keep all contact on Crewboard.");
  }

  const message = await db.message.create({
    data: { conversationId, senderId: userId, body: body.trim() },
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });

  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await pusher.trigger(`conversation-${conversationId}`, "new-message", message);

  const recipientId = conv.participants.find((p) => p !== userId);
  if (recipientId) {
    const sender = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, twitterHandle: true },
    });
    const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";
    await db.notification.create({
      data: {
        userId: recipientId,
        type: "message",
        title: "New message",
        body: `${senderName}: ${body.trim().slice(0, 60)}`,
        link: `/messages/${conversationId}`,
      },
    });
  }

  revalidatePath(`/messages/${conversationId}`);
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

  revalidatePath(`/messages/${conversationId}`);
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
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });

  return JSON.parse(JSON.stringify(messages)); // Ensure plain object for client components
}

export async function startConversation(recipientId: string) {
  const session = await auth();
  const senderId = (session?.user as any)?.userId as string | undefined;
  if (!senderId) redirect("/login");

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
    redirect(`/messages/${existing.id}`);
  } else {
    const conv = await db.conversation.create({
      data: { participants: [senderId, recipientId] },
      select: { id: true },
    });
    redirect(`/messages/${conv.id}`);
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

async function sendAutoMessage(conversationId: string, senderId: string, recipientId: string, body: string) {
  const message = await db.message.create({
    data: { conversationId, senderId, body },
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });
  await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  try { await pusher.trigger(`conversation-${conversationId}`, "new-message", message); } catch {}
  const sender = await db.user.findUnique({ where: { id: senderId }, select: { name: true, twitterHandle: true } });
  const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";
  await db.notification.create({
    data: {
      userId: recipientId,
      type: "message",
      title: "New hire request",
      body: `${senderName}: ${body.slice(0, 60)}`,
      link: `/messages/${conversationId}`,
    },
  });
}

export async function hireFromProfile(recipientId: string) {
  const session = await auth();
  const senderId = (session?.user as any)?.userId as string | undefined;
  if (!senderId) redirect("/login");

  const convId = await getOrCreateConversation(senderId, recipientId);
  await sendAutoMessage(convId, senderId, recipientId, "Hi! I want to hire you. Can we discuss the details?");
  redirect(`/messages/${convId}`);
}

export async function hireFromGig(gigId: string, sellerId: string) {
  const session = await auth();
  const senderId = (session?.user as any)?.userId as string | undefined;
  if (!senderId) redirect("/login");

  const gig = await db.gig.findUnique({
    where: { id: gigId },
    select: { title: true, price: true, deliveryDays: true },
  });
  if (!gig) redirect("/gigs");

  // Create order record
  const order = await db.order.create({
    data: { gigId, buyerId: senderId, sellerId, amount: gig.price, status: "pending" },
    select: { id: true },
  });

  const convId = await getOrCreateConversation(senderId, sellerId);
  const body = `__GIGREQUEST__:${JSON.stringify({ id: gigId, orderId: order.id, title: gig.title, price: gig.price, days: gig.deliveryDays })}`;
  await sendAutoMessage(convId, senderId, sellerId, body);
  redirect(`/orders/${order.id}`);
}
