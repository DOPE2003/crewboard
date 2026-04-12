"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createMessage } from "@/lib/sendMessage";

export async function toggleSaveTalent(targetUserId: string): Promise<{ saved: boolean }> {
  const session = await auth();
  const saverId = (session?.user as any)?.userId as string | undefined;
  if (!saverId) throw new Error("Not authenticated");
  if (saverId === targetUserId) throw new Error("Cannot save yourself");

  const existing = await db.savedTalent.findUnique({
    where: { saverId_savedUserId: { saverId, savedUserId: targetUserId } },
  });

  if (existing) {
    await db.savedTalent.delete({ where: { id: existing.id } });
    revalidatePath("/saved-talents");
    return { saved: false };
  } else {
    await db.savedTalent.create({ data: { saverId, savedUserId: targetUserId } });
    revalidatePath("/saved-talents");
    return { saved: true };
  }
}

export async function getProfilesForSwipe() {
  const session = await auth();
  const currentUserId = (session?.user as any)?.userId as string | undefined;

  const users = await db.user.findMany({
    where: {
      id: { not: currentUserId ?? "" },
      profileComplete: true,
    },
    select: {
      id: true,
      name: true,
      image: true,
      bannerImage: true,
      role: true,
      userTitle: true,
      bio: true,
      skills: true,
      availability: true,
      twitterHandle: true,
      telegramHandle: true,
      isOG: true,
      walletAddress: true,
      createdAt: true,
      sellerOrders: {
        where: { status: "completed" },
        select: { id: true, amount: true },
      },
      reviewsReceived: {
        select: { rating: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    image: u.image,
    bannerImage: u.bannerImage,
    role: u.userTitle ?? (u.role !== "USER" && u.role !== "MODERATOR" && u.role !== "ADMIN" ? u.role : null),
    bio: u.bio,
    skills: u.skills,
    availability: u.availability,
    twitterHandle: u.twitterHandle,
    isOG: u.isOG,
    walletAddress: u.walletAddress,
    ordersCompleted: u.sellerOrders.length,
    totalEarned: u.sellerOrders.reduce((sum, o) => sum + (o.amount || 0), 0),
    avgRating:
      u.reviewsReceived.length > 0
        ? u.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
          u.reviewsReceived.length
        : null,
    reviewCount: u.reviewsReceived.length,
  }));
}

export async function saveProfileAction(targetUserId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  await db.savedTalent.upsert({
    where: {
      saverId_savedUserId: { saverId: userId, savedUserId: targetUserId },
    },
    update: {},
    create: { saverId: userId, savedUserId: targetUserId },
  });
  return { success: true };
}

export async function sendHireMessage(targetUserId: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  // Conversation.participants is a String[] — find existing conv between the two
  let conversation = await db.conversation.findFirst({
    where: {
      participants: { hasEvery: [userId, targetUserId] },
    },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        participants: [userId, targetUserId],
      },
    });
  }

  await createMessage({
    conversationId: conversation.id,
    senderId: userId,
    body: "Hi, I want to hire you for a specific service. Let's chat.",
  });

  return { success: true, conversationId: conversation.id };
}
