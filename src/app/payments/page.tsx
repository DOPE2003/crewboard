import { requireUserId } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";

export default async function PaymentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const userId = await requireUserId();
  const { tab = "all" } = await searchParams;

  // Fetch orders where user is buyer or seller
  const [buyerOrders, sellerOrders] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { title: true, category: true } },
        seller: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { title: true, category: true } },
        buyer: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  const spent = buyerOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + o.amount, 0);

  const earned = sellerOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + o.amount, 0);

  const pending = [
    ...buyerOrders.filter((o) => ["pending", "accepted", "funded"].includes(o.status)),
    ...sellerOrders.filter((o) => ["pending", "accepted", "funded"].includes(o.status)),
  ].reduce((s, o) => s + o.amount, 0);

  type BuyerRow = (typeof buyerOrders)[number];
  type SellerRow = (typeof sellerOrders)[number];

  const allRows: ({ direction: "sent" } & BuyerRow | { direction: "received" } & SellerRow)[] = [
    ...buyerOrders.map((o) => ({ ...o, direction: "sent" as const })),
    ...sellerOrders.map((o) => ({ ...o, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered =
    tab === "sent"
      ? allRows.filter((r) => r.direction === "sent")
      : tab === "received"
      ? allRows.filter((r) => r.direction === "received")
      : tab === "pending"
      ? allRows.filter((r) => ["pending", "accepted", "funded"].includes(r.status))
      : allRows;

  const statusColor: Record<string, string> = {
    completed: "#22c55e",
    pending: "#f59e0b",
    accepted: "#14b8a6",
    funded: "#6366f1",
    delivered: "#a855f7",
    cancelled: "#ef4444",
  };

  const tabs = [
    { key: "all",      label: "All" },
    { key: "sent",     label: "Sent" },
    { key: "received", label: "Received" },
    { key: "pending",  label: "Pending" },
  ];

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#14b8a6", marginBottom: "0.5rem", fontWeight: 700 }}>
            — WALLET & PAYMENTS
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            Payment History
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 6 }}>
            All your transactions on Crewboard
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Earned",   value: `$${earned.toLocaleString()}`,   color: "#22c55e" },
            { label: "Total Spent",    value: `$${spent.toLocaleString()}`,    color: "#ef4444" },
            { label: "In Escrow",      value: `$${pending.toLocaleString()}`,  color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "var(--card-bg)", border: "1px solid var(--card-border)",
              borderRadius: 14, padding: "1.25rem",
            }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, fontFamily: "Space Mono, monospace", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {tabs.map((t) => (
            <Link key={t.key} href={`/payments?tab=${t.key}`} style={{
              padding: "6px 16px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
              textDecoration: "none",
              background: tab === t.key ? "#14b8a6" : "var(--card-bg)",
              color: tab === t.key ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--card-border)",
            }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* Transaction list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem",
              background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--card-border)" }}>
              No transactions found.
            </div>
          )}

          {filtered.map((row) => {
            const isSent = row.direction === "sent";
            const counterpart = isSent
              ? (row as typeof buyerOrders[number] & { direction: "sent" }).seller
              : (row as typeof sellerOrders[number] & { direction: "received" }).buyer;

            return (
              <div key={row.id + row.direction} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "var(--card-bg)", border: "1px solid var(--card-border)",
                borderRadius: 12, padding: "1rem 1.25rem",
              }}>
                {/* Direction icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isSent ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  fontSize: 16,
                }}>
                  {isSent ? "↑" : "↓"}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.88rem", marginBottom: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.gig.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#14b8a6", fontWeight: 600 }}>@{counterpart.twitterHandle}</span>
                    <span>·</span>
                    <span>{row.gig.category}</span>
                    <span>·</span>
                    <span>{new Date(row.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: "1rem", fontWeight: 800,
                    color: isSent ? "#ef4444" : "#22c55e",
                    fontFamily: "Space Mono, monospace",
                    marginBottom: 4,
                  }}>
                    {isSent ? "-" : "+"}${row.amount.toLocaleString()}
                  </div>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    background: `${statusColor[row.status] ?? "#888"}18`,
                    color: statusColor[row.status] ?? "#888",
                  }}>
                    {row.status}
                  </span>
                </div>

                {/* Link to order */}
                <Link href={`/orders/${row.id}`} style={{
                  flexShrink: 0, padding: "0.35rem 0.75rem", borderRadius: 8,
                  fontSize: "0.7rem", fontWeight: 700, textDecoration: "none",
                  border: "1px solid var(--card-border)", color: "var(--text-muted)",
                  background: "transparent",
                }}>
                  View →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        <div style={{ marginTop: "2.5rem" }}>
          <Link href="/billing" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>
            ← Back to Wallet
          </Link>
        </div>

      </div>
    </main>
  );
}
