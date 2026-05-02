"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function markAllNotificationsAsRead() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return { ok: false };
  await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return;
  await db.notification.updateMany({ where: { id, userId }, data: { read: true } });
  revalidatePath("/", "layout");
}

export async function deleteNotification(id: string) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return { ok: false };
  await db.notification.deleteMany({ where: { id, userId } });
  revalidatePath("/notifications");
  return { ok: true };
}
