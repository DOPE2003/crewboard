import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import MineClient from "./MineClient";

export default async function MyServicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  const userId = (session.user as any).userId;

  const [gigs, sellerOrders, buyerOrders] = await Promise.all([
    db.gig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: { in: ["pending", "accepted", "funded", "delivered"] } },
      include: {
        gig: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.order.findMany({
      where: { buyerId: userId },
      include: {
        gig: { select: { id: true, title: true } },
        seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <MineClient
      gigs={gigs.map((g) => ({ ...g, createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString() }))}
      sellerOrders={sellerOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() }))}
      buyerOrders={buyerOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString() }))}
    />
  );
}
