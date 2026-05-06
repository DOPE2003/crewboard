"use server";

import { requireAdmin, requireOwner, requireUserId, OWNER_HANDLE } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@/lib/generated/prisma/client";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { logAdminAction } from "@/lib/audit";

export async function setUserRole(userId: string, newRole: Role) {
  const callerId = await requireOwner();
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, twitterHandle: true, role: true } });
  if (!user) throw new Error("User not found.");
  if (user.twitterHandle === OWNER_HANDLE) throw new Error("Cannot change the owner's role.");

  await db.user.update({ where: { id: userId }, data: { role: newRole } });

  logAdminAction({ actorId: callerId ?? "web", action: "role.change", targetId: userId, metadata: { newRole, prevRole: user.role } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleOGBadge(userId: string, grant: boolean) {
  const callerId = await requireOwner();
  await db.user.update({
    where: { id: userId },
    data: { isOG: grant, ogGrantedAt: grant ? new Date() : null },
  });

  logAdminAction({ actorId: callerId ?? "web", action: grant ? "og.grant" : "og.revoke", targetId: userId });

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
  const callerId = await requireOwner();
  const target = await db.user.findUnique({ where: { id: userId }, select: { twitterHandle: true } });
  if (target?.twitterHandle === OWNER_HANDLE) throw new Error("Cannot delete the owner account.");

  await db.user.delete({ where: { id: userId } });

  logAdminAction({ actorId: callerId ?? "web", action: "user.delete", targetId: userId, metadata: { handle: target?.twitterHandle } });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deactivateGig(gigId: string) {
  const callerId = await requireAdmin();
  await db.gig.update({ where: { id: gigId }, data: { status: "inactive" } });
  logAdminAction({ actorId: callerId ?? "web", action: "gig.deactivate", targetId: gigId });
  revalidatePath("/admin/gigs");
  return { ok: true };
}

export async function activateGig(gigId: string) {
  const callerId = await requireAdmin();
  await db.gig.update({ where: { id: gigId }, data: { status: "active" } });
  logAdminAction({ actorId: callerId ?? "web", action: "gig.activate", targetId: gigId });
  revalidatePath("/admin/gigs");
  return { ok: true };
}

export async function adminUpdateOrderStatus(orderId: string, status: string) {
  const callerId = await requireAdmin();
  const prev = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  await db.order.update({ where: { id: orderId }, data: { status } });
  logAdminAction({ actorId: callerId ?? "web", action: "order.cancel", targetId: orderId, metadata: { newStatus: status, prevStatus: prev?.status } });
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function syncDisputeResolved(
  orderId: string,
  txHash: string,
  routeToBuyer: boolean,
) {
  const callerId = await requireAdmin();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");

  await db.order.update({
    where: { id: orderId },
    data: { status: "cancelled", txHash },
  });

  logAdminAction({ actorId: callerId ?? "web", action: "dispute.resolve", targetId: orderId, metadata: { txHash, routeToBuyer } });

  const winnerId = routeToBuyer ? order.buyerId  : order.sellerId;
  const loserId  = routeToBuyer ? order.sellerId : order.buyerId;

  const winnerBody = routeToBuyer
    ? `Your dispute for "${order.gig.title}" has been reviewed and resolved in your favor. Your funds have been returned to your wallet.`
    : `Your dispute for "${order.gig.title}" has been reviewed and resolved in your favor. Payment has been released to your wallet.`;

  const loserBody = routeToBuyer
    ? `Your dispute for "${order.gig.title}" has been reviewed and closed. The funds were returned to the buyer.`
    : `Your dispute for "${order.gig.title}" has been reviewed and closed. The payment was released to the seller.`;

  await Promise.all([
    notifyUser({ userId: winnerId, type: "order", title: "Dispute Resolved in Your Favor", body: winnerBody, link: `/orders/${orderId}`, actionUrl: `crewboard://order/${orderId}` }),
    notifyUser({ userId: loserId,  type: "order", title: "Dispute Resolved",               body: loserBody,  link: `/orders/${orderId}`, actionUrl: `crewboard://order/${orderId}` }),
    sendPush({ userId: winnerId, title: "Dispute Resolved in Your Favor", body: winnerBody, data: { type: "dispute_resolved", orderId, actionUrl: `crewboard://order/${orderId}` } }).catch(() => {}),
    sendPush({ userId: loserId,  title: "Dispute Resolved",               body: loserBody,  data: { type: "dispute_resolved", orderId, actionUrl: `crewboard://order/${orderId}` } }).catch(() => {}),
  ]);

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/disputes");
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function deleteShowcasePost(postId: string) {
  const callerId = await requireAdmin();
  await db.showcasePost.delete({ where: { id: postId } });
  logAdminAction({ actorId: callerId ?? "web", action: "gig.deactivate", targetId: postId });
  revalidatePath("/admin/showcase");
  return { ok: true };
}

export async function closeJob(jobId: string) {
  const callerId = await requireAdmin();
  await db.job.update({ where: { id: jobId }, data: { status: "closed" } });
  logAdminAction({ actorId: callerId ?? "web", action: "job.close", targetId: jobId });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  return { ok: true };
}

export async function reopenJob(jobId: string) {
  const callerId = await requireAdmin();
  await db.job.update({ where: { id: jobId }, data: { status: "open" } });
  logAdminAction({ actorId: callerId ?? "web", action: "job.reopen", targetId: jobId });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  return { ok: true };
}

export async function adminDeleteJob(jobId: string) {
  const callerId = await requireAdmin();
  await db.job.delete({ where: { id: jobId } });
  logAdminAction({ actorId: callerId ?? "web", action: "job.delete", targetId: jobId });
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  return { ok: true };
}
