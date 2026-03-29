import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import BillingClient from "./BillingClient";

export const metadata = { title: "Billing & Wallet — Crewboard" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [dbUser, completedOrders, pendingOrders, allOrders] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, name: true },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true },
    }).catch(() => []),
    db.order.findMany({
      where: { sellerId: userId, status: { in: ["pending", "accepted", "funded", "delivered"] } },
      select: { amount: true },
    }).catch(() => []),
    db.order.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      select: { id: true, amount: true, status: true, buyerId: true, createdAt: true, gig: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []),
  ]);

  if (!dbUser) redirect("/login");

  const totalEarned = completedOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);
  const totalPending = pendingOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);

  return (
    <BillingClient
      walletAddress={dbUser.walletAddress}
      totalEarned={totalEarned}
      totalPending={totalPending}
      userId={userId}
      orders={allOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
