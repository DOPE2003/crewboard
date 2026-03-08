"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { pusher } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

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
