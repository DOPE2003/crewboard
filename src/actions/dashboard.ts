"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

export async function getDashboardData() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { gigs: { where: { status: "active" }, select: { id: true } } },
  });

  return user;
}
