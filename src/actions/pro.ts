"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

export async function joinProWaitlist() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  const existing = await db.proWaitlist.findUnique({ where: { userId } });
  if (existing) return { success: true, alreadyJoined: true };

  await db.proWaitlist.create({ data: { userId } });

  await db.notification.create({
    data: {
      userId,
      type: "system",
      title: "You joined the Pro waitlist!",
      body: "You're on the Crewboard Pro waitlist. We'll notify you the moment it launches. Thank you for your support! 🚀",
      read: false,
    },
  });

  return { success: true, alreadyJoined: false };
}

export async function checkProWaitlist() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { isOnWaitlist: false };

  const entry = await db.proWaitlist.findUnique({ where: { userId } });
  return { isOnWaitlist: !!entry };
}

export async function notifyProWaitlist() {
  const waitlist = await db.proWaitlist.findMany({
    where: { notified: false },
    include: { user: true },
  });

  for (const entry of waitlist) {
    await db.notification.create({
      data: {
        userId: entry.userId,
        type: "system",
        title: "🎉 Crewboard Pro is live!",
        body: "You were on the waitlist — get early access now. Click to learn more.",
        read: false,
      },
    });
    await db.proWaitlist.update({ where: { id: entry.id }, data: { notified: true } });
  }

  return { notified: waitlist.length };
}
