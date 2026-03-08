"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function markAllNotificationsAsRead() {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  revalidatePath("/layout"); // Update navbar count
  
  return { ok: true };
}
