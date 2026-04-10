import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/mobile/messages?conversationId=<id>&limit=50
export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

  const messages = await db.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { id: true, name: true, twitterHandle: true, image: true },
      },
      replyTo: {
        select: { id: true, body: true, sender: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return NextResponse.json(messages);
}

// POST /api/mobile/messages — send a new message
export async function POST(req: NextRequest) {
  try {
    const { conversationId, senderId, body, replyToId } = await req.json();

    if (!conversationId || !senderId || !body) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId,
        body,
        replyToId: replyToId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, twitterHandle: true, image: true },
        },
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (err) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
