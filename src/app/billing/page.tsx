import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import BillingClient from "./BillingClient";

export const metadata = { title: "Wallet — Crewboard" };

export default async function BillingPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const [dbUser, allOrders, categoryOrders] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, name: true },
    }),
    db.order.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      select: {
        id: true, amount: true, status: true,
        buyerId: true, sellerId: true,
        createdAt: true,
        gig: { select: { title: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []),
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true, createdAt: true, gig: { select: { category: true } } },
    }).catch(() => []),
  ]);

  if (!dbUser) redirect("/login");

  // Balance breakdown — amounts are gross (what buyer paid).
  // Seller receives 90% (10% platform fee goes to treasury on-chain).
  const FEE_RATE = 0.10;
  const grossEarned     = allOrders.filter((o) => o.sellerId === userId && o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const totalFees       = Math.floor(grossEarned * FEE_RATE);
  const totalEarned     = grossEarned - totalFees;
  const inEscrow        = allOrders.filter((o) => o.status === "funded").reduce((s, o) => s + o.amount, 0);
  const pendingRelease  = allOrders.filter((o) => o.sellerId === userId && o.status === "delivered").reduce((s, o) => s + o.amount, 0);

  // Monthly chart
  const now = new Date();
  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyMap[d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })] = 0;
  }
  for (const o of categoryOrders) {
    const key = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (key in monthlyMap) monthlyMap[key] += o.amount;
  }
  const monthlyEarnings = Object.entries(monthlyMap).map(([month, total]) => ({ month, total }));

  // Category breakdown
  const catMap: Record<string, number> = {};
  for (const o of categoryOrders) {
    const cat = o.gig?.category ?? "Other";
    catMap[cat] = (catMap[cat] ?? 0) + o.amount;
  }
  const earningsByCategory = Object.entries(catMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return (
    <BillingClient
      walletAddress={dbUser.walletAddress}
      totalEarned={totalEarned}
      totalFees={totalFees}
      inEscrow={inEscrow}
      pendingRelease={pendingRelease}
      userId={userId}
      orders={allOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
      earningsByCategory={earningsByCategory}
      monthlyEarnings={monthlyEarnings}
    />
  );
}
