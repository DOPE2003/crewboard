import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import { OrderActions } from "./OrderActions";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status = "all" } = await searchParams;

  const orders = await db.order.findMany({
    where: status !== "all" ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      gig: { select: { title: true, category: true } },
      buyer: { select: { name: true, twitterHandle: true } },
      seller: { select: { name: true, twitterHandle: true } },
    },
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    pending:   { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" },
    accepted:  { bg: "rgba(99,102,241,0.1)",  color: "#6366f1" },
    funded:    { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
    delivered: { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
    completed: { bg: "rgba(34,197,94,0.1)",   color: "#22c55e" },
    cancelled: { bg: "rgba(239,68,68,0.1)",   color: "#ef4444" },
  };

  const TABS = ["all", "pending", "accepted", "funded", "delivered", "completed", "cancelled"];

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#ef4444", marginBottom: "0.5rem", fontWeight: 700 }}>— ORDERS</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>Order Management</h1>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {TABS.map((s) => (
            <Link key={s} href={`/admin/orders?status=${s}`} style={{
              padding: "6px 14px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
              textDecoration: "none",
              background: status === s ? "#14b8a6" : "var(--card-bg)",
              color: status === s ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--card-border)",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>

        <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "rgba(var(--foreground-rgb),0.02)", textAlign: "left" }}>
                  {["Gig", "Buyer", "Seller", "Amount", "Status", "Date", "Action"].map((h) => (
                    <th key={h} style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const sc = statusColors[order.status] ?? { bg: "rgba(0,0,0,0.04)", color: "var(--text-muted)" };
                  return (
                    <tr key={order.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                      <td style={{ padding: "1rem 1.25rem", maxWidth: 200 }}>
                        <div style={{ fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {order.gig.title}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{order.gig.category}</div>
                      </td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <Link href={`/u/${order.buyer.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                          @{order.buyer.twitterHandle}
                        </Link>
                      </td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <Link href={`/u/${order.seller.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                          @{order.seller.twitterHandle}
                        </Link>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--foreground)" }}>${order.amount}</td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color }}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <OrderActions orderId={order.id} status={order.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>No orders found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
