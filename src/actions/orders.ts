"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { verifyEscrowVaultFunded, verifyEscrowReleased } from "@/lib/escrow-build";
import { logAdminAction } from "@/lib/audit";
import { createMessage } from "@/lib/sendMessage";
import { addOrderToPortfolio } from "@/lib/auto-portfolio";

export async function createOrder(gigId: string, sellerId: string) {
  const buyerId = await requireUserId();
  if (buyerId === sellerId) throw new Error("Cannot hire yourself");

  const gig = await db.gig.findUnique({ where: { id: gigId }, select: { price: true, title: true } });
  if (!gig) throw new Error("Gig not found");

  const order = await db.order.create({
    data: { gigId, buyerId, sellerId, amount: gig.price, status: "pending" },
    select: { id: true },
  });

  logAdminAction({ actorId: buyerId, action: "order.placed", targetId: order.id });

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
    accepted:            { by: "seller", from: ["funded"] },
    delivered:           { by: "seller", from: ["accepted", "revision_requested"] },
    revision_requested:  { by: "buyer",  from: ["delivered"] },
    cancelled:           { by: "both",   from: ["pending"] },
    disputed:            { by: "both",   from: ["accepted", "funded", "delivered", "revision_requested"] },
  };

  const rule = allowed[status];
  if (!rule) throw new Error("Invalid status");
  if (!rule.from.includes(order.status)) throw new Error(`Cannot move from ${order.status} to ${status}`);
  if (rule.by === "buyer" && !isBuyer) throw new Error("Only buyer can do this");
  if (rule.by === "seller" && !isSeller) throw new Error("Only seller can do this");

  await db.order.update({ where: { id: orderId }, data: { status } });

  logAdminAction({ actorId: userId, action: `order.${status}`, targetId: orderId });

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
    revision_requested: "requested a revision",
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
    select: {
      buyerId: true, sellerId: true, status: true, amount: true, txHash: true,
      buyer:  { select: { walletAddress: true } },
      seller: { select: { walletAddress: true } },
      gig:    { select: { title: true } },
    },
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

  // Verify on-chain: PDA must match this order, vault must exist and hold expected USDC.
  // Fail closed on rpcError — do not proceed when chain is unreachable.
  const verify = await verifyEscrowVaultFunded(escrowAddress, order.amount, {
    resolveRealTxHash: txHash === "recovered",
    buyerAddress:  order.buyer.walletAddress  ?? undefined,
    sellerAddress: order.seller.walletAddress ?? undefined,
    orderId,
  });
  if (!verify.ok) {
    if (verify.rpcError) throw new Error(
      "Solana RPC is temporarily unavailable. Your transaction is safe — please retry in a moment.",
    );
    throw new Error(verify.error);
  }
  if (verify.txHashHint) txHash = verify.txHashHint;

  await db.order.update({
    where: { id: orderId },
    data: { status: "funded", txHash, escrowAddress },
  });

  logAdminAction({ actorId: userId, action: "order.funded", targetId: orderId, metadata: { txHash } });

  await notifyUser({
    userId: order.sellerId,
    type: "order",
    title: "Order Funded",
    body: `Payment for "${order.gig.title}" is locked in escrow — start working!`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });
  sendPush({ userId: order.sellerId, title: "Order Funded", body: `Payment for "${order.gig.title}" is locked in escrow — start working!`, data: { type: "order_funded", orderId, actionUrl: `crewboard://order/${orderId}` } }).catch(() => {});

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

// Buyer requests changes after delivery
export async function requestRevision(orderId: string, message: string) {
  const userId = await requireUserId();
  if (!message.trim()) throw new Error("Revision message is required");

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.buyerId !== userId) throw new Error("Only buyer can request revision");
  if (order.status !== "delivered") throw new Error("Order is not in delivered state");

  // Find or create conversation between buyer and seller
  let conv = await db.conversation.findFirst({
    where: { AND: [{ participants: { has: order.buyerId } }, { participants: { has: order.sellerId } }] },
    select: { id: true },
  });
  if (!conv) {
    conv = await db.conversation.create({
      data: { participants: [order.buyerId, order.sellerId] },
      select: { id: true },
    });
  }

  await db.order.update({ where: { id: orderId }, data: { status: "revision_requested" } });
  logAdminAction({ actorId: userId, action: "order.revision_requested", targetId: orderId });

  await createMessage({ conversationId: conv.id, senderId: userId, body: `[Revision Request] ${message.trim()}` });

  await notifyUser({
    userId: order.sellerId,
    type: "order",
    title: "Revision Requested",
    body: `Buyer requested changes on "${order.gig.title}": ${message.trim().slice(0, 100)}`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });
  sendPush({ userId: order.sellerId, title: "Revision Requested", body: `Buyer requested changes on "${order.gig.title}"`, data: { type: "revision_requested", orderId, actionUrl: `crewboard://order/${orderId}` } }).catch(() => {});

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

// Seller resubmits work after revision request
export async function resubmitWork(orderId: string, message?: string) {
  const userId = await requireUserId();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.sellerId !== userId) throw new Error("Only seller can resubmit");
  if (order.status !== "revision_requested") throw new Error("Order is not awaiting revision");

  let conv = await db.conversation.findFirst({
    where: { AND: [{ participants: { has: order.buyerId } }, { participants: { has: order.sellerId } }] },
    select: { id: true },
  });
  if (!conv) {
    conv = await db.conversation.create({
      data: { participants: [order.buyerId, order.sellerId] },
      select: { id: true },
    });
  }

  await db.order.update({ where: { id: orderId }, data: { status: "delivered" } });
  logAdminAction({ actorId: userId, action: "order.resubmitted", targetId: orderId });

  const body = message?.trim()
    ? `[Resubmission] ${message.trim()}`
    : "[Resubmission] Work has been updated. Please review.";
  await createMessage({ conversationId: conv.id, senderId: userId, body });

  await notifyUser({
    userId: order.buyerId,
    type: "order",
    title: "Work Resubmitted",
    body: `The seller updated their delivery for "${order.gig.title}" — please review and release payment.`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });
  sendPush({ userId: order.buyerId, title: "Work Resubmitted", body: `The seller updated their delivery for "${order.gig.title}" — please review and release payment.`, data: { type: "work_resubmitted", orderId, actionUrl: `crewboard://order/${orderId}` } }).catch(() => {});

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

// Called from client after on-chain release tx confirms
export async function syncEscrowReleased(orderId: string, txHash: string) {
  const userId = await requireUserId();

  if (!txHash?.trim()) throw new Error("txHash is required");

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      buyerId: true, sellerId: true, status: true, escrowAddress: true, amount: true,
      buyer:  { select: { walletAddress: true } },
      seller: { select: { walletAddress: true } },
      gig:    { select: { title: true, category: true, image: true } },
      offer:  { select: { title: true } },
    },
  });
  if (!order) throw new Error("Order not found");
  if (order.buyerId !== userId) throw new Error("Only buyer can release");
  if (order.status !== "delivered") throw new Error("Order is not delivered");
  if (!order.escrowAddress) throw new Error("No escrow address on record — funds were never locked on-chain");

  // Verify on-chain: vault must be closed (empty) before marking complete.
  // Rejects fake txHash submissions — the DB never flips to "completed" without confirmation.
  const verify = await verifyEscrowReleased(order.escrowAddress, {
    buyerAddress:  order.buyer.walletAddress  ?? undefined,
    sellerAddress: order.seller.walletAddress ?? undefined,
    orderId,
  });
  if (!verify.ok) {
    if (verify.rpcError) throw new Error(
      "Solana RPC is temporarily unavailable. Please retry in a moment.",
    );
    throw new Error(verify.error);
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: "completed", txHash },
  });

  logAdminAction({ actorId: userId, action: "order.completed", targetId: orderId, metadata: { txHash } });

  addOrderToPortfolio(order.sellerId, {
    title: order.offer?.title ?? order.gig.title,
    category: order.gig.category,
    imageUrl: order.gig.image,
    amount: order.amount,
  }).catch(() => {});

  await notifyUser({
    userId: order.sellerId,
    type: "order",
    title: "Payment Released!",
    body: `You've been paid for "${order.gig.title}" — funds are in your wallet.`,
    link: `/orders/${orderId}`,
    actionUrl: `crewboard://order/${orderId}`,
  });
  sendPush({ userId: order.sellerId, title: "💸 Payment Released!", body: `You've been paid for "${order.gig.title}" — funds are in your wallet.`, data: { type: "payment", orderId, actionUrl: `crewboard://order/${orderId}` } }).catch(() => {});

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}
