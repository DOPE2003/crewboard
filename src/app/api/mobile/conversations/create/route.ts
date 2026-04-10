import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// POST /api/mobile/conversations/create
// Creates or finds an existing conversation between two users
export async function POST(req: NextRequest) {
  try {
    const { userId, otherUserId } = await req.json();

    if (!userId || !otherUserId) {
      return NextResponse.json({ error: "Missing userId or otherUserId." }, { status: 400 });
    }

    // Check if conversation already exists between these two users
    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { has: userId } },
          { participants: { has: otherUserId } },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ conversationId: existing.id });
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        participants: [userId, otherUserId],
      },
      select: { id: true },
    });

    return NextResponse.json({ conversationId: conversation.id });
  } catch (err) {
    console.error("Create conversation error:", err);
    return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
  }
}
