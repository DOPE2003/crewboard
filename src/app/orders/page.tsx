import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

export default async function OrdersPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const [buyerOrders, sellerOrders] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        buyer: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  const allOrders = [
    ...buyerOrders.map((o) => ({ ...o, role: "buyer"  as const, other: o.seller })),
    ...sellerOrders.map((o) => ({ ...o, role: "seller" as const, other: o.buyer  })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>

      {/* Page header */}
      <div style={{ borderBottom: "1px solid var(--card-border)", padding: "1.25rem 1.5rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: "0.52rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#14B8A6", fontWeight: 700, marginBottom: 4 }}>
            Dashboard
          </div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.01em" }}>
            Orders
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <OrdersClient orders={allOrders as any} />
      </div>

    </main>
  );
}
