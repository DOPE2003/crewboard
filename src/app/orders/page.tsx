import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  accepted:  "#3b82f6",
  funded:    "#3b82f6",
  delivered: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#94a3b8",
  disputed:  "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  accepted:  "In Progress",
  funded:    "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed:  "Disputed",
};

export default async function OrdersPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const [buyerOrders, sellerOrders] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        buyer: { select: { id: true, name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  return (
    <main className="page">
      <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.3rem", fontFamily: "Rajdhani, sans-serif", letterSpacing: "-0.01em" }}>Orders</h1>
        <p style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.45)", marginBottom: "2.5rem" }}>Track all your active and past orders.</p>

        {/* As buyer */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,0,0,0.4)", marginBottom: "0.85rem" }}>
            Placed by me
          </div>
          {buyerOrders.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.4)", padding: "1.5rem", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", textAlign: "center", background: "rgba(0,0,0,0.02)" }}>
              You haven&apos;t hired anyone yet.{" "}
              <Link href="/gigs" style={{ color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>Browse gigs →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {buyerOrders.map((o) => (
                <OrderRow key={o.id} order={o} other={o.seller} role="buyer" />
              ))}
            </div>
          )}
        </div>

        {/* As seller */}
        <div>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(0,0,0,0.4)", marginBottom: "0.85rem" }}>
            Received orders
          </div>
          {sellerOrders.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.4)", padding: "1.5rem", borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", textAlign: "center", background: "rgba(0,0,0,0.02)" }}>
              No orders received yet.{" "}
              <Link href="/gigs/new" style={{ color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>Post a gig →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {sellerOrders.map((o) => (
                <OrderRow key={o.id} order={o} other={o.buyer} role="seller" />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function OrderRow({ order, other, role }: { order: any; other: any; role: "buyer" | "seller" }) {
  const color = STATUS_COLORS[order.status] ?? "#94a3b8";
  const label = STATUS_LABELS[order.status] ?? order.status;
  return (
    <Link
      href={`/orders/${order.id}`}
      className="order-row-link"
      style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "1rem 1.25rem", borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
        textDecoration: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(0,0,0,0.06)" }}>
        {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.gig.title}
        </div>
        <div style={{ fontSize: "0.7rem", color: "rgba(0,0,0,0.45)", marginTop: 2 }}>
          {role === "buyer" ? "Seller" : "Buyer"}: {other?.name ?? other?.twitterHandle ?? "Unknown"} · {order.gig.category}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>${order.amount}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, padding: "2px 10px", borderRadius: 99, background: `${color}15`, border: `1px solid ${color}50` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.58rem", fontWeight: 600, color, letterSpacing: "0.04em", fontFamily: "Space Mono, monospace" }}>{label}</span>
        </div>
      </div>
    </Link>
  );
}
