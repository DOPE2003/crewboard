"use server";

import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/generated/prisma/client";

export async function toggleUserAdmin(userId: string) {
  const admin = await requireAdmin();
  
  if (admin.userId === userId) {
    throw new Error("You cannot revoke your own admin status.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new Error("User not found.");

  const nextRole = user.role === Role.ADMIN ? Role.USER : Role.ADMIN;

  await db.user.update({
    where: { id: userId },
    data: { role: nextRole },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleGigFeatured(gigId: string) {
  await requireAdmin();
  // Future: Toggle 'featured' boolean on Gig model
}
