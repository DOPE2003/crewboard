import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/mobile/conversations?userId=<userId>
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const conversations = await db.conversation.findMany({
    where: {
      participants: { has: userId },
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true, twitterHandle: true, image: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  // Enrich with participant info
  const allParticipantIds = [...new Set(conversations.flatMap((c) => c.participants))];
  const users = await db.user.findMany({
    where: { id: { in: allParticipantIds } },
    select: { id: true, name: true, twitterHandle: true, image: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const enriched = conversations.map((c) => ({
    ...c,
    participantDetails: c.participants.map((pid: string) => userMap[pid] || { id: pid }),
  }));

  return NextResponse.json(enriched);
}
