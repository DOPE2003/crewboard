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

  type BuyerRow  = (typeof buyerOrders)[number];
  type SellerRow = (typeof sellerOrders)[number];

  const allRows: ({ direction: "sent" } & BuyerRow | { direction: "received" } & SellerRow)[] = [
    ...buyerOrders.map((o)  => ({ ...o, direction: "sent"     as const })),
    ...sellerOrders.map((o) => ({ ...o, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered =
    tab === "sent"     ? allRows.filter((r) => r.direction === "sent") :
    tab === "received" ? allRows.filter((r) => r.direction === "received") :
    tab === "pending"  ? allRows.filter((r) => ["pending", "accepted", "funded"].includes(r.status)) :
    allRows;

  const statusColor: Record<string, string> = {
    completed: "#22c55e",
    pending:   "#f59e0b",
    accepted:  "#14b8a6",
    funded:    "#6366f1",
    delivered: "#a855f7",
    cancelled: "#ef4444",
    disputed:  "#ef4444",
  };

  const tabs = [
    { key: "all",      label: "All"      },
    { key: "sent",     label: "Sent"     },
    { key: "received", label: "Received" },
    { key: "pending",  label: "Pending"  },
  ];

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        /* Stats grid: 1 col on mobile → 3 col on sm+ */
        .ph-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          margin-bottom: 1.75rem;
        }
        @media (min-width: 480px) {
          .ph-stats { grid-template-columns: repeat(3, 1fr); }
        }

        /* Transaction row */
        .ph-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 1rem;
          width: 100%;
          box-sizing: border-box;
        }
        .ph-row-body  { flex: 1; min-width: 0; }
        .ph-row-right { flex-shrink: 0; text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }

        /* Tabs: wrap on very small screens */
        .ph-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.25rem; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(5rem,10vw,8rem) 1rem 4rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#14b8a6", marginBottom: "0.5rem", fontWeight: 700 }}>
            — WALLET & PAYMENTS
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem,4vw,2rem)", fontWeight: 800, color: "var(--foreground)", margin: "0 0 6px" }}>
            Payment History
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
            All your transactions on Crewboard
          </p>
        </div>

        {/* Stats — stacks to 1 col on mobile */}
        <div className="ph-stats">
          {[
            { label: "Total Earned", value: `$${earned.toLocaleString()}`, color: "#22c55e", bg: "rgba(34,197,94,0.06)",  border: "rgba(34,197,94,0.18)"  },
            { label: "Total Spent",  value: `$${spent.toLocaleString()}`,  color: "#ef4444", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.18)"  },
            { label: "In Escrow",    value: `$${pending.toLocaleString()}`, color: "#f59e0b", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)" },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 14, padding: "1rem 1.15rem",
            }}>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.65rem", fontWeight: 800, color: s.color, fontFamily: "Space Mono, monospace", lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="ph-tabs">
          {tabs.map((t) => (
            <Link key={t.key} href={`/payments?tab=${t.key}`} style={{
              padding: "7px 16px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 700,
              textDecoration: "none",
              background: tab === t.key ? "#14b8a6" : "var(--card-bg)",
              color:      tab === t.key ? "#fff"    : "var(--text-muted)",
              border: "1px solid var(--card-border)",
              whiteSpace: "nowrap",
            }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* Transaction list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{
              padding: "3.5rem 1.5rem", textAlign: "center",
              color: "var(--text-muted)", fontSize: "0.9rem",
              background: "var(--card-bg)", borderRadius: 14,
              border: "1px solid var(--card-border)",
            }}>
              No transactions found.
            </div>
          )}

          {filtered.map((row) => {
            const isSent      = row.direction === "sent";
            const counterpart = isSent
              ? (row as typeof buyerOrders[number]  & { direction: "sent"     }).seller
              : (row as typeof sellerOrders[number] & { direction: "received" }).buyer;
            const sc = statusColor[row.status] ?? "#888";
            const amtColor = isSent ? "#ef4444" : "#22c55e";

            return (
              <div key={row.id + row.direction} className="ph-row">
                {/* Direction icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isSent ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  fontSize: 16, marginTop: 2,
                }}>
                  {isSent ? "↑" : "↓"}
                </div>

                {/* Body — stacked vertically */}
                <div className="ph-row-body">
                  {/* Title */}
                  <div style={{
                    fontWeight: 700, color: "var(--foreground)", fontSize: "0.88rem",
                    marginBottom: "0.25rem",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {row.gig.title}
                  </div>

                  {/* Amount — below title, large */}
                  <div style={{
                    fontSize: "1rem", fontWeight: 800,
                    color: amtColor,
                    fontFamily: "Space Mono, monospace",
                    marginBottom: "0.3rem",
                  }}>
                    {isSent ? "−" : "+"}${row.amount.toLocaleString()}
                  </div>

                  {/* Status badge */}
                  <div style={{ marginBottom: "0.3rem" }}>
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 700, padding: "2px 9px",
                      borderRadius: 99, background: `${sc}18`, color: sc,
                      textTransform: "capitalize",
                    }}>
                      {row.status}
                    </span>
                  </div>

                  {/* Handle · category · date */}
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#14b8a6", fontWeight: 600 }}>@{counterpart.twitterHandle}</span>
                    {row.gig.category && <><span>·</span><span>{row.gig.category}</span></>}
                    <span>·</span>
                    <span>{new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                {/* View link — always visible, right-aligned */}
                <Link href={`/orders/${row.id}`} style={{
                  flexShrink: 0, alignSelf: "center",
                  padding: "7px 12px", borderRadius: 9,
                  fontSize: "0.7rem", fontWeight: 700, textDecoration: "none",
                  border: "1px solid var(--card-border)", color: "var(--text-muted)",
                  whiteSpace: "nowrap",
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
