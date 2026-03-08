"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";

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
