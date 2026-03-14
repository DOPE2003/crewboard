"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

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
