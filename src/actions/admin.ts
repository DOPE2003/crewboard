"use server";

import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/generated/prisma/client";

export async function setUserRole(userId: string, newRole: Role) {
  const admin = await requireAdmin();
  if (admin.userId === userId && newRole !== Role.ADMIN)
    throw new Error("You cannot revoke your own admin status.");
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error("User not found.");
  await db.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleOGBadge(userId: string, grant: boolean) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { isOG: grant } });
  if (grant) {
    await db.notification.create({
      data: {
        userId,
        type: "og_badge",
        title: "You earned the OG Badge",
        body: "You're one of the founding builders on Crewboard. Your OG badge is now live on your profile.",
      },
    });
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.userId === userId) throw new Error("You cannot delete your own account.");
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deactivateGig(gigId: string) {
  await requireAdmin();
  await db.gig.update({ where: { id: gigId }, data: { status: "inactive" } });
  revalidatePath("/admin/gigs");
  return { ok: true };
}

export async function activateGig(gigId: string) {
  await requireAdmin();
  await db.gig.update({ where: { id: gigId }, data: { status: "active" } });
  revalidatePath("/admin/gigs");
  return { ok: true };
}

export async function adminUpdateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  await db.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function deleteShowcasePost(postId: string) {
  await requireAdmin();
  await db.showcasePost.delete({ where: { id: postId } });
  revalidatePath("/admin/showcase");
  return { ok: true };
}
