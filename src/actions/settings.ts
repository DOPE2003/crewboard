"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveNotificationEmail(email: string) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return { error: "Not authenticated" };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Enter a valid email address" };
  }

  // Check if already taken by another account
  const existing = await db.user.findFirst({
    where: { email: trimmed, NOT: { id: userId } },
    select: { id: true },
  });
  if (existing) return { error: "This email is already linked to another account" };

  await db.user.update({ where: { id: userId }, data: { email: trimmed } });
  revalidatePath("/u/[handle]", "page");
  return { ok: true };
}
