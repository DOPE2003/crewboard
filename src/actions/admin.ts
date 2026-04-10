"use server";

import { requireAdmin, requireOwner, OWNER_HANDLE } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/generated/prisma/client";
import { notifyUser } from "@/lib/notify";

export async function setUserRole(userId: string, newRole: Role) {
  await requireOwner();
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, twitterHandle: true } });
  if (!user) throw new Error("User not found.");
  // Cannot change the owner's own role
  if (user.twitterHandle === OWNER_HANDLE) throw new Error("Cannot change the owner's role.");
  await db.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleOGBadge(userId: string, grant: boolean) {
  await requireOwner();
  await db.user.update({ where: { id: userId }, data: { isOG: grant } });
  if (grant) {
    await notifyUser({
      userId,
      type: "og_badge",
      title: "You earned the OG Badge",
      body: "You're one of the founding builders on Crewboard. Your OG badge is now live on your profile.",
    });
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(userId: string) {
  await requireOwner();
  const target = await db.user.findUnique({ where: { id: userId }, select: { twitterHandle: true } });
  if (target?.twitterHandle === OWNER_HANDLE) throw new Error("Cannot delete the owner account.");
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

export async function syncDisputeResolved(
  orderId: string,
  txHash: string,
  routeToBuyer: boolean,
) {
  await requireAdmin();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");

  await db.order.update({
    where: { id: orderId },
    data: { status: "cancelled", txHash },
  });

  const winnerId  = routeToBuyer ? order.buyerId  : order.sellerId;
  const loserId   = routeToBuyer ? order.sellerId : order.buyerId;
  const winLabel  = routeToBuyer ? "refunded to buyer" : "released to seller";

  await Promise.all([
    notifyUser({
      userId: winnerId,
      type: "order",
      title: "Dispute Resolved — You Won",
      body: `Admin resolved the dispute for "${order.gig.title}". Funds have been ${winLabel}.`,
      link: `/orders/${orderId}`,
    }),
    notifyUser({
      userId: loserId,
      type: "order",
      title: "Dispute Resolved",
      body: `Admin resolved the dispute for "${order.gig.title}". Funds were ${winLabel}.`,
      link: `/orders/${orderId}`,
    }),
  ]);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/disputes");
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function deleteShowcasePost(postId: string) {
  await requireAdmin();
  await db.showcasePost.delete({ where: { id: postId } });
  revalidatePath("/admin/showcase");
  return { ok: true };
}
