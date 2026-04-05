"use server";

import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/generated/prisma/client";

export async function setUserRole(userId: string, newRole: Role) {
  const admin = await requireAdmin();
  
  if (admin.userId === userId && newRole !== Role.ADMIN) {
    throw new Error("You cannot revoke your own admin status.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) throw new Error("User not found.");

  await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleGigFeatured(gigId: string) {
  await requireAdmin();
}
