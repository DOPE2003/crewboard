import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { pusher } from "@/lib/pusher";

// GET /api/messages/[id] — fetch messages in a conversation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const conv = await db.conversation.findUnique({
    where: { id },
    select: { participants: true },
  });
  if (!conv || !conv.participants.includes(userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });

  // Mark unread messages (sent by the other person) as read
  await db.message.updateMany({
    where: { conversationId: id, read: false, senderId: { not: userId } },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

// POST /api/messages/[id] — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const conv = await db.conversation.findUnique({
    where: { id },
    select: { participants: true },
  });
  if (!conv || !conv.participants.includes(userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const message = await db.message.create({
    data: { conversationId: id, senderId: userId, body: body.trim() },
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });

  // Update conversation updatedAt so inbox sorts correctly
  await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  // Trigger Pusher event so the recipient gets it instantly
  await pusher.trigger(`conversation-${id}`, "new-message", message);

  // In-app notification for the recipient (with link to the conversation)
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
        link: `/messages/${id}`,
      },
    });
  }

  return NextResponse.json(message, { status: 201 });
}
