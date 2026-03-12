"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createOrder(gigId: string) {
  const session = await auth();
  const buyerId = session?.user?.userId;

  if (!buyerId) {
    throw new Error("You must be logged in to hire talent.");
  }

  // 1. Fetch Gig and verify seller
  const gig = await db.gig.findUnique({
    where: { id: gigId },
    include: { user: true },
  });

  if (!gig) throw new Error("Gig not found.");
  if (gig.userId === buyerId) throw new Error("You cannot hire yourself.");

  // 2. Check Wallets
  const buyer = await db.user.findUnique({
    where: { id: buyerId },
    select: { walletAddress: true },
  });

  if (!buyer?.walletAddress) {
    throw new Error("Please link your Solana wallet in your dashboard before hiring.");
  }

  if (!gig.user.walletAddress) {
    throw new Error("This seller has not linked their Solana wallet yet.");
  }

  // 3. Create Pending Order
  const order = await db.order.create({
    data: {
      gigId: gig.id,
      buyerId: buyerId,
      sellerId: gig.userId,
      amount: gig.price,
      status: "pending",
    },
  });

  revalidatePath(`/gigs/${gigId}`);
  revalidatePath("/dashboard");

  return order;
}

export async function updateOrderFunding(orderId: string, txHash: string) {
  const session = await auth();
  if (!session?.user?.userId) throw new Error("Unauthorized");

  const order = await db.order.update({
    where: { id: orderId, buyerId: session.user.userId },
    data: {
      status: "funded",
      txHash: txHash,
    },
  });

  revalidatePath("/dashboard");
  return order;
}

export async function markOrderDelivered(orderId: string) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) throw new Error("Unauthorized");

  const order = await db.order.update({
    where: { id: orderId, sellerId: userId },
    data: { status: "delivered" },
  });

  // Notify the buyer
  await db.notification.create({
    data: {
      userId: order.buyerId,
      type: "system",
      title: "Work Delivered",
      body: `The seller has marked your order as delivered. Review and release funds.`,
      link: "/dashboard",
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function completeOrder(orderId: string, releaseTxHash: string) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) throw new Error("Unauthorized");

  await db.order.update({
    where: { id: orderId, buyerId: userId },
    data: { status: "completed" },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
