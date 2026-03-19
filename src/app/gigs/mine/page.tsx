import db from "@/lib/db";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:   "#f59e0b",
  funded:    "#3b82f6",
  delivered: "#8b5cf6",
  completed: "#22c55e",
  cancelled: "#94a3b8",
  disputed:  "#ef4444",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  funded:    "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed:  "Disputed",
};

export default async function MyGigsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const [gigs, sellerOrders, buyerOrders] = await Promise.all([
    db.gig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    // Orders where I'm the seller (working on)
    db.order.findMany({
      where: { sellerId: userId, status: { in: ["pending", "funded", "delivered"] } },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        buyer: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
    // Orders where I'm the buyer (requested)
    db.order.findMany({
      where: { buyerId: userId, status: { notIn: ["completed", "cancelled"] } },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        seller: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  return (
    <main className="page" style={{ paddingBottom: 0 }}>
      {/* Top bar */}
      <div style={{ maxWidth: "100%", padding: "0 1.5rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>
          — Services
        </div>
        <Link href="/gigs/new" className="btn-primary" style={{ display: "inline-flex", fontSize: "0.78rem", padding: "0.6rem 1.4rem" }}>
          + Post a Gig
        </Link>
      </div>

      {/* 3-column vertical split */}
      <div className="mine-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, height: "calc(100vh - 145px)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        {/* ── Column 1: My offered services ── */}
        <div className="mine-col" style={{ overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem 1.25rem 2rem" }}>
          <SectionLabel>My Offered Services</SectionLabel>
          {gigs.length === 0 ? (
            <EmptyState message="You haven't posted any gigs yet." cta="Post your first gig" href="/gigs/new" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {gigs.map((gig) => (
                <Link key={gig.id} href={`/gigs/${gig.id}`} className="gig-card">
                  <div className="gig-card-top">
                    <span className="gig-category-badge">{gig.category}</span>
                    <span className="gig-price">${gig.price}</span>
                  </div>
                  <h2 className="gig-title">{gig.title}</h2>
                  <p className="gig-desc">{gig.description}</p>
                  {gig.tags.length > 0 && (
                    <div className="gig-tags">
                      {gig.tags.slice(0, 4).map((t) => (
                        <span key={t} className="dash-skill-chip">{t}</span>
                      ))}
                      {gig.tags.length > 4 && <span className="dash-skill-chip">+{gig.tags.length - 4}</span>}
                    </div>
                  )}
                  <div className="gig-footer">
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: gig.status === "active" ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.06)",
                      color: gig.status === "active" ? "#14b8a6" : "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {gig.status}
                    </span>
                    <span className="gig-delivery">{gig.deliveryDays}d delivery</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Column 2: Services I'm working on (seller) ── */}
        <div className="mine-col" style={{ overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem 1.25rem 2rem" }}>
          <SectionLabel>Services I&apos;m Working On</SectionLabel>
          {sellerOrders.length === 0 ? (
            <EmptyState message="No active orders to deliver right now." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {sellerOrders.map((o: any) => (
                <OrderCard key={o.id} order={o} other={o.buyer} role="seller" />
              ))}
            </div>
          )}
        </div>

        {/* ── Column 3: Services I requested (buyer) ── */}
        <div className="mine-col" style={{ overflowY: "auto", padding: "1.25rem 1.25rem 2rem" }}>
          <SectionLabel>Services I Requested</SectionLabel>
          {buyerOrders.length === 0 ? (
            <EmptyState message="You haven't hired anyone yet." cta="Browse gigs" href="/gigs" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {buyerOrders.map((o: any) => (
                <OrderCard key={o.id} order={o} other={o.seller} role="buyer" />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.9rem" }}>
      {children}
    </div>
  );
}

function EmptyState({ message, cta, href }: { message: string; cta?: string; href?: string }) {
  return (
    <div style={{ padding: "1.25rem", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>
      {message}
      {cta && href && (
        <> <Link href={href} style={{ color: "#2DD4BF", textDecoration: "none" }}>{cta} →</Link></>
      )}
    </div>
  );
}

function OrderCard({ order, other, role }: { order: any; other: any; role: "buyer" | "seller" }) {
  const color = ORDER_STATUS_COLORS[order.status] ?? "#94a3b8";
  const label = ORDER_STATUS_LABELS[order.status] ?? order.status;
  return (
    <Link href={`/orders/${order.id}`} style={{
      display: "flex", alignItems: "center", gap: "1rem",
      padding: "1rem 1.25rem", borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.07)", background: "#1e2433",
      textDecoration: "none", transition: "border-color 0.15s",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.08)" }}>
        {other?.image && <img src={other.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.gig.title}
        </div>
        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 2 }}>
          {role === "buyer" ? "Seller" : "Buyer"}: {other?.name ?? other?.twitterHandle ?? "Unknown"} · {order.gig.category}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#2DD4BF" }}>${order.amount}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, padding: "2px 10px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}40` }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 600, color, letterSpacing: "0.04em" }}>{label}</span>
        </div>
      </div>
    </Link>
  );
}
