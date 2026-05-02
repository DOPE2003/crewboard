"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";

async function getUserId() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");
  return userId;
}

export async function toggleSaveGig(gigId: string): Promise<{ saved: boolean }> {
  const userId = await getUserId();

  const existing = await db.savedGig.findUnique({
    where: { userId_gigId: { userId, gigId } },
    select: { id: true },
  });

  if (existing) {
    await db.savedGig.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await db.savedGig.create({ data: { userId, gigId } });
  return { saved: true };
}

export async function getSavedGigIds(): Promise<string[]> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return [];

  const rows = await db.savedGig.findMany({
    where: { userId },
    select: { gigId: true },
  });
  return rows.map((r) => r.gigId);
}
