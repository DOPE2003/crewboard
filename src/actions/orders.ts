"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";
import { notifyUser } from "@/lib/notify";

export async function createOrder(gigId: string, sellerId: string) {
  const buyerId = await requireUserId();
  if (buyerId === sellerId) throw new Error("Cannot hire yourself");

  const gig = await db.gig.findUnique({ where: { id: gigId }, select: { price: true, title: true } });
  if (!gig) throw new Error("Gig not found");

  const order = await db.order.create({
    data: { gigId, buyerId, sellerId, amount: gig.price, status: "pending" },
    select: { id: true },
  });

  // Notify seller
  const buyer = await db.user.findUnique({ where: { id: buyerId }, select: { name: true, twitterHandle: true } });
  const buyerName = buyer?.name ?? buyer?.twitterHandle ?? "Someone";
  await notifyUser({
    userId: sellerId,
    type: "order",
    title: "New Order",
    body: `${buyerName} placed an order for "${gig.title}"`,
    link: `/orders/${order.id}`,
    actionUrl: `crewboard://order/${order.id}`,
  });

  revalidatePath("/orders");
  return order.id;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const userId = await requireUserId();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");

  // Permission rules
  const isBuyer = order.buyerId === userId;
  const isSeller = order.sellerId === userId;
  if (!isBuyer && !isSeller) throw new Error("Unauthorized");

  // "completed" is intentionally absent — it must only happen via
  // syncEscrowReleased, which requires a confirmed on-chain txHash.
  const allowed: Record<string, { by: "buyer" | "seller" | "both"; from: string[] }> = {
    accepted:  { by: "seller", from: ["pending", "funded"] },
    delivered: { by: "seller", from: ["accepted"] },
    cancelled: { by: "both",   from: ["pending"] },
    disputed:  { by: "both",   from: ["accepted", "funded", "delivered"] },
  };

  const rule = allowed[status];
  if (!rule) throw new Error("Invalid status");
  if (!rule.from.includes(order.status)) throw new Error(`Cannot move from ${order.status} to ${status}`);
  if (rule.by === "buyer" && !isBuyer) throw new Error("Only buyer can do this");
  if (rule.by === "seller" && !isSeller) throw new Error("Only seller can do this");

  await db.order.update({ where: { id: orderId }, data: { status } });

  // Notify the other party
  const notifyId = isBuyer ? order.sellerId : order.buyerId;
  const actor = await db.user.findUnique({ where: { id: userId }, select: { name: true, twitterHandle: true } });
  const actorName = actor?.name ?? actor?.twitterHandle ?? "Someone";

  const statusLabels: Record<string, string> = {
    funded: "accepted your order",
    delivered: "marked the order as delivered",
    completed: "confirmed order completion",
    cancelled: "cancelled the order",
    disputed: "opened a dispute",
  };

  await notifyUser({
    userId: notifyId,
    type: "order",
    title: "Order Update",
    body: `${actorName} ${statusLabels[status]} — ${order.gig.title}`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

// Re-request: create a new order from the same cancelled order
export async function reRequestOrder(orderId: string): Promise<{ redirectTo: string }> {
  const session = await auth();
  const buyerId = session?.user?.userId;
  if (!buyerId) return { redirectTo: "/login" };

  const original = await db.order.findUnique({
    where: { id: orderId },
    select: { gigId: true, sellerId: true, buyerId: true, status: true, gig: { select: { price: true, title: true } } },
  });
  if (!original) throw new Error("Order not found");
  if (original.buyerId !== buyerId) throw new Error("Unauthorized");
  if (original.status !== "cancelled") throw new Error("Can only re-request a cancelled order");

  const newOrder = await db.order.create({
    data: { gigId: original.gigId, buyerId, sellerId: original.sellerId, amount: original.gig.price, status: "pending" },
    select: { id: true },
  });

  const buyer = await db.user.findUnique({ where: { id: buyerId }, select: { name: true, twitterHandle: true } });
  const buyerName = buyer?.name ?? buyer?.twitterHandle ?? "Someone";
  await notifyUser({
    userId: original.sellerId,
    type: "order",
    title: "New Order",
    body: `${buyerName} re-requested "${original.gig.title}"`,
    link: `/orders/${newOrder.id}`,
    actionUrl: `crewboard://order/${newOrder.id}`,
  });

  return { redirectTo: `/orders/${newOrder.id}` };
}

// Called from client after on-chain escrow funding tx confirms
export async function syncEscrowFunded(orderId: string, txHash: string, escrowAddress: string) {
  const userId = await requireUserId();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, txHash: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.buyerId !== userId) throw new Error("Only buyer can fund");

  // Idempotent: if already funded (e.g. DB was updated by a previous attempt
  // that the client didn't see), treat as success instead of throwing.
  if (order.status === "funded") {
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return;
  }

  if (order.status !== "pending") throw new Error(`Cannot fund order in status: ${order.status}`);

  await db.order.update({
    where: { id: orderId },
    data: { status: "funded", txHash, escrowAddress },
  });

  await notifyUser({
    userId: order.sellerId,
    type: "order",
    title: "Order Funded",
    body: `Payment for "${order.gig.title}" is locked in escrow — start working!`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

// Called from client after on-chain release tx confirms
export async function syncEscrowReleased(orderId: string, txHash: string) {
  const userId = await requireUserId();

  if (!txHash?.trim()) throw new Error("txHash is required");

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, escrowAddress: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.buyerId !== userId) throw new Error("Only buyer can release");
  if (order.status !== "delivered") throw new Error("Order is not delivered");
  if (!order.escrowAddress) throw new Error("No escrow address on record — funds were never locked on-chain");

  await db.order.update({
    where: { id: orderId },
    data: { status: "completed", txHash },
  });

  await notifyUser({
    userId: order.sellerId,
    type: "order",
    title: "Payment Released!",
    body: `You've been paid for "${order.gig.title}" — funds are in your wallet.`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}
