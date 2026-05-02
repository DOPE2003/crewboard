"use server";

import { requireUserId, getStaffRole } from "@/lib/auth-utils";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";
import { logAdminAction } from "@/lib/audit";

export async function openDispute(
  orderId: string,
  reason: string,
  description: string,
  evidenceUrl?: string,
): Promise<string> {
  const userId = await requireUserId();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found.");
  if (order.buyerId !== userId && order.sellerId !== userId) throw new Error("Unauthorized.");
  if (!["funded", "accepted", "delivered"].includes(order.status)) {
    throw new Error("Cannot dispute this order.");
  }

  const dispute = await db.dispute.create({
    data: {
      orderId,
      filedById: userId,
      reason: reason.trim(),
      description: description.trim(),
      status: "open",
      previousOrderStatus: order.status,
      ...(evidenceUrl?.trim() ? {
        evidence: { create: { type: "url", url: evidenceUrl.trim() } },
      } : {}),
      messages: {
        create: { senderId: userId, body: description.trim() },
      },
    },
    select: { id: true },
  });

  await db.order.update({ where: { id: orderId }, data: { status: "disputed" } });

  logAdminAction({ actorId: userId, action: "order.disputed", targetId: orderId, metadata: { disputeId: dispute.id } });

  const otherId = order.buyerId === userId ? order.sellerId : order.buyerId;
  notifyUser({
    userId: otherId,
    type: "order",
    title: "Dispute Opened",
    body: `A dispute was opened on "${order.gig.title}". Please respond.`,
    link: `/disputes/${dispute.id}`,
    actionUrl: `crewboard://dispute/${dispute.id}`,
  }).catch(() => {});

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return dispute.id;
}

export async function addDisputeMessage(
  disputeId: string,
  body: string,
  attachmentUrl?: string,
) {
  const userId = await requireUserId();

  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    select: { status: true, order: { select: { buyerId: true, sellerId: true } } },
  });
  if (!dispute) throw new Error("Dispute not found.");

  const isParty = userId === dispute.order.buyerId || userId === dispute.order.sellerId;
  const staffRole = await getStaffRole();
  if (!isParty && !staffRole) throw new Error("Unauthorized.");
  if (dispute.status !== "open") throw new Error("Dispute is already closed.");

  await db.$transaction(async (tx) => {
    await tx.disputeMessage.create({ data: { disputeId, senderId: userId, body: body.trim() } });
    if (attachmentUrl?.trim()) {
      await tx.disputeEvidence.create({ data: { disputeId, type: "url", url: attachmentUrl.trim() } });
    }
  });

  revalidatePath(`/disputes/${disputeId}`);
  revalidatePath(`/admin/disputes`);
}

export async function adminResolveDispute(
  disputeId: string,
  decision: "refund" | "release",
  notes?: string,
) {
  const staffRole = await getStaffRole();
  if (!staffRole || staffRole === "support") throw new Error("Admin required.");

  const dispute = await db.dispute.findUnique({
    where: { id: disputeId },
    select: {
      status: true, orderId: true,
      order: { select: { buyerId: true, sellerId: true, gig: { select: { title: true } } } },
    },
  });
  if (!dispute) throw new Error("Dispute not found.");
  if (dispute.status !== "open") throw new Error("Dispute is already closed.");

  await db.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        resolution: { decision, notes: notes?.trim() ?? null },
        messages: {
          create: {
            isSystem: true,
            body: `Dispute resolved by admin: ${decision}${notes?.trim() ? ` — ${notes.trim()}` : ""}.`,
          },
        },
      },
    });
    if (decision === "refund") {
      await tx.order.update({ where: { id: dispute.orderId }, data: { status: "cancelled" } });
    } else {
      await tx.order.update({ where: { id: dispute.orderId }, data: { status: "completed" } });
    }
  });

  for (const uid of [dispute.order.buyerId, dispute.order.sellerId]) {
    notifyUser({
      userId: uid,
      type: "order",
      title: "Dispute Resolved",
      body: `Your dispute for "${dispute.order.gig.title}" has been resolved: ${decision}.`,
      link: `/disputes/${disputeId}`,
      actionUrl: `crewboard://dispute/${disputeId}`,
    }).catch(() => {});
  }

  revalidatePath(`/disputes/${disputeId}`);
  revalidatePath(`/admin/disputes`);
  revalidatePath(`/orders/${dispute.orderId}`);
}
