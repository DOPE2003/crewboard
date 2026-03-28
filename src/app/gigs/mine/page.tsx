import db from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MyGigsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const [gigs, sellerOrders, buyerOrders] = await Promise.all([
    db.gig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: { in: ["pending", "funded", "delivered"] } },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { id: true, title: true, category: true } },
        buyer: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
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
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4, margin: "0 0 4px 0" }}>
              Dashboard
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 }}>My Services</h1>
          </div>
          <a
            href="/gigs/new"
            style={{
              background: "#14B8A6", color: "white", padding: "12px 20px",
              borderRadius: 12, fontWeight: 600, fontSize: 14,
              textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            + Post a Service
          </a>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 24 }}>

          {/* Column 1: My Offered Services */}
          <div>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.08em",
              paddingBottom: 12, borderBottom: "1px solid #e5e7eb",
              marginBottom: 16, margin: "0 0 16px 0",
            }}>
              My Offered Services
            </h2>

            {gigs.length === 0 ? (
              <EmptyState label="No services posted yet" />
            ) : (
              gigs.map((gig) => (
                <div
                  key={gig.id}
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    marginBottom: 16,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Category + price */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 12px",
                      borderRadius: 99, background: "#E1F5EE", color: "#0F6E56",
                    }}>
                      {gig.category}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#14B8A6" }}>${gig.price}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.4 }}>
                    {gig.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6,
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {gig.description}
                  </p>

                  {/* Tags */}
                  {gig.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {gig.tags.slice(0, 4).map((tag) => (
                        <span key={tag} style={{
                          fontSize: 11, fontWeight: 500, padding: "2px 10px",
                          borderRadius: 99, background: "#f3f4f6", color: "#6b7280",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Status + delivery + actions */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: 12, borderTop: "1px solid #f3f4f6", marginTop: 4,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                        background: gig.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: gig.status === "active" ? "#16a34a" : "#9ca3af",
                      }}>
                        {gig.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{gig.deliveryDays}d delivery</span>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <a href={`/gigs/${gig.id}`} style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>
                        View
                      </a>
                      <a href={`/gigs/${gig.id}/edit`} style={{ fontSize: 12, fontWeight: 600, color: "#14B8A6", textDecoration: "none" }}>
                        Edit →
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Services I'm Working On (seller) */}
          <div>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.08em",
              paddingBottom: 12, borderBottom: "1px solid #e5e7eb",
              marginBottom: 16, margin: "0 0 16px 0",
            }}>
              Services I&apos;m Working On
            </h2>

            {sellerOrders.length === 0 ? (
              <EmptyState label="No active orders to deliver" />
            ) : (
              sellerOrders.map((o: any) => (
                <OrderCard key={o.id} order={o} other={o.buyer} />
              ))
            )}
          </div>

          {/* Column 3: Services I Requested (buyer) */}
          <div>
            <h2 style={{
              fontSize: 11, fontWeight: 700, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.08em",
              paddingBottom: 12, borderBottom: "1px solid #e5e7eb",
              marginBottom: 16, margin: "0 0 16px 0",
            }}>
              Services I Requested
            </h2>

            {buyerOrders.length === 0 ? (
              <EmptyState label="You haven't hired anyone yet" />
            ) : (
              buyerOrders.map((o: any) => (
                <OrderCard key={o.id} order={o} other={o.seller} />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 24px", textAlign: "center",
      background: "white", border: "1px dashed #e5e7eb", borderRadius: 16,
    }}>
      <span style={{ fontSize: 36, marginBottom: 12 }}>📭</span>
      <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>{label}</p>
    </div>
  );
}

function OrderCard({ order, other }: { order: any; other: any }) {
  const statusBg =
    order.status === "completed" ? "#dcfce7" :
    order.status === "pending"   ? "#fef3c7" :
    order.status === "cancelled" ? "#f3f4f6" :
    order.status === "disputed"  ? "#fee2e2" : "#ccfbf1";

  const statusColor =
    order.status === "completed" ? "#16a34a" :
    order.status === "pending"   ? "#d97706" :
    order.status === "cancelled" ? "#9ca3af" :
    order.status === "disputed"  ? "#dc2626" : "#0f766e";

  return (
    <a
      href={`/orders/${order.id}`}
      style={{
        display: "block", background: "white", border: "1px solid #e5e7eb",
        borderRadius: 16, padding: 16, marginBottom: 12, textDecoration: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {other?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={other.image}
            alt=""
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#14B8A6" }}>
              {(other?.name ?? other?.twitterHandle ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 4px 0", lineHeight: 1.4 }}>
            {order.gig.title}
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 10px 0" }}>
            with {other?.name ?? other?.twitterHandle ?? "Unknown"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#14B8A6" }}>${order.amount}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
              background: statusBg, color: statusColor,
            }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
