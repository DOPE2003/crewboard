import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import BillingClient from "./BillingClient";

export const metadata = { title: "Billing & Wallet — Crewboard" };

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [dbUser, completedOrders, pendingOrders, allOrders, categoryOrders] = await Promise.all([
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
    // earnings by gig category
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true, createdAt: true, gig: { select: { category: true } } },
    }).catch(() => []),
  ]);

  if (!dbUser) redirect("/login");

  const totalEarned = completedOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);
  const totalPending = pendingOrders.reduce((s: number, o: { amount: number }) => s + o.amount, 0);

  // Build category breakdown
  const categoryMap: Record<string, number> = {};
  for (const o of categoryOrders) {
    const cat = o.gig?.category ?? "Other";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + o.amount;
  }
  const earningsByCategory = Object.entries(categoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  // Build monthly earnings (last 6 months)
  const now = new Date();
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthlyMap[key] = 0;
  }
  for (const o of categoryOrders) {
    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (key in monthlyMap) monthlyMap[key] += o.amount;
  }
  const monthlyEarnings = Object.entries(monthlyMap).map(([month, total]) => ({ month, total }));

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
      earningsByCategory={earningsByCategory}
      monthlyEarnings={monthlyEarnings}
    />
  );
}
