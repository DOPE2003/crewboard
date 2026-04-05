"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Session } from "next-auth";

/**
 * Helper to verify if a session belongs to an ADMIN
 */
export function checkIsAdmin(session: Session | null) {
  return session?.user?.role === "ADMIN";
}

/**
 * Buyer raises a dispute for a funded order
 */
export async function raiseDispute(orderId: string) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("You must be logged in to raise a dispute.");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, status: true },
  });

  if (!order) throw new Error("Order not found.");
  if (order.buyerId !== userId) throw new Error("Unauthorized. Only the buyer can raise a dispute.");
  if (order.status !== "funded" && order.status !== "delivered") {
    throw new Error("Only funded or delivered orders can be disputed.");
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: "disputed" },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);

  return { ok: true };
}

/**
 * Admin resolves a dispute in the database after on-chain transaction success
 */
export async function resolveDisputeDb(
  orderId: string, 
  resolution: "buyer_refunded" | "seller_paid", 
  txHash: string
) {
  const session = await auth();
  if (!checkIsAdmin(session)) {
    throw new Error("Unauthorized. Admin access required.");
  }

  await db.order.update({
    where: { id: orderId },
    data: { 
      status: "resolved",
      txHash: txHash, // Log the resolution transaction hash
    },
  });

  revalidatePath("/admin/disputes");
  revalidatePath("/dashboard");

  return { ok: true };
}
