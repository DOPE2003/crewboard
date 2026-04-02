"use server";

import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function toggleUserAdmin(userId: string) {
  const admin = await requireAdmin();
  
  if (admin.userId === userId) {
    throw new Error("You cannot revoke your own admin status.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user) throw new Error("User not found.");

  await db.user.update({
    where: { id: userId },
    data: { isAdmin: !user.isAdmin },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleGigFeatured(gigId: string) {
  await requireAdmin();
  
  // Note: We'll need a 'featured' field in Gig model if we want this.
  // For now, let's stick to user management.
}
