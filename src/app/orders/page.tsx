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
  disputed:  "Payment Dispute",
};

type Tab = "all" | "sent" | "received" | "disputes";

const TABS: { key: Tab; label: string }[] = [
  { key: "all",      label: "All Orders"   },
  { key: "sent",     label: "Offers Sent"  },
  { key: "received", label: "Offers Received" },
  { key: "disputes", label: "Disputes"     },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const { tab = "all" } = await searchParams;
  const activeTab = (["all", "sent", "received", "disputes"].includes(tab) ? tab : "all") as Tab;

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

  // Filter by tab
  const sentOrders     = buyerOrders;
  const receivedOrders = sellerOrders;
  const disputeOrders  = [...buyerOrders, ...sellerOrders].filter((o) => o.status === "disputed");

  const showSent     = activeTab === "all" || activeTab === "sent";
  const showReceived = activeTab === "all" || activeTab === "received";
  const showDisputes = activeTab === "disputes";

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", marginBottom: "0.3rem", letterSpacing: "-0.01em" }}>Orders</h1>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>Track all your active and past orders.</p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: "2rem", flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/orders?tab=${t.key}`}
              style={{
                padding: "6px 16px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
                textDecoration: "none",
                background: activeTab === t.key ? "#14B8A6" : "var(--card-bg)",
                color: activeTab === t.key ? "#fff" : "var(--text-muted)",
                border: "1px solid var(--card-border)",
              }}
            >
              {t.label}
              {t.key === "disputes" && disputeOrders.length > 0 && (
                <span style={{ marginLeft: 6, background: "#ef444430", color: "#ef4444", borderRadius: 99, padding: "1px 6px", fontSize: 10 }}>
                  {disputeOrders.length}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Payment Disputes section */}
        {showDisputes && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#ef4444", fontWeight: 700, marginBottom: "0.85rem" }}>
              Payment Disputes
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
              Disputes are raised when there is a disagreement about payment between buyer and seller. Contact support if you need help resolving a dispute.
            </p>
            {disputeOrders.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "1.5rem", borderRadius: 14, border: "1px solid var(--card-border)", textAlign: "center" }}>
                No payment disputes. Good work!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {disputeOrders.map((o: any) => (
                  <OrderRow key={o.id} order={o} other={o.buyer ?? o.seller} role={o.buyerId === userId ? "buyer" : "seller"} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sent (buyer) */}
        {showSent && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
              Offers Sent
            </div>
            {sentOrders.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "1.5rem", borderRadius: 14, border: "1px solid var(--card-border)", textAlign: "center" }}>
                You haven&apos;t placed any orders yet.{" "}
                <Link href="/gigs" style={{ color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>Browse services →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {sentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} other={o.seller} role="buyer" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Received (seller) */}
        {showReceived && (
          <div>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
              Offers Received
            </div>
            {receivedOrders.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "1.5rem", borderRadius: 14, border: "1px solid var(--card-border)", textAlign: "center" }}>
                No orders received yet.{" "}
                <Link href="/gigs/new" style={{ color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>Post a service →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {receivedOrders.map((o) => (
                  <OrderRow key={o.id} order={o} other={o.buyer} role="seller" />
                ))}
              </div>
            )}
          </div>
        )}
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
        border: "1px solid var(--card-border)",
        background: "var(--card-bg)",
        textDecoration: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(var(--foreground-rgb), 0.06)" }}>
        {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.gig.title}
        </div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
          {role === "buyer" ? "Seller" : "Buyer"}: {other?.name ?? other?.twitterHandle ?? "Unknown"} · {order.gig.category}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)" }}>${order.amount}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 5, padding: "2px 10px", borderRadius: 99, background: `${color}15`, border: `1px solid ${color}50` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span style={{ fontSize: "0.58rem", fontWeight: 600, color, letterSpacing: "0.04em", fontFamily: "Inter, sans-serif" }}>{label}</span>
        </div>
      </div>
    </Link>
  );
}
