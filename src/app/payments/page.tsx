import { requireUserId } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Payment History — Crewboard" };

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
        seller: { select: { name: true, twitterHandle: true, image: true, walletAddress: true } },
      },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        gig: { select: { title: true, category: true } },
        buyer: { select: { name: true, twitterHandle: true, image: true, walletAddress: true } },
      },
    }),
  ]);

  const spent   = buyerOrders.filter(o => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const earned  = sellerOrders.filter(o => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const pending = [...buyerOrders, ...sellerOrders].filter(o => ["pending","accepted","funded"].includes(o.status)).reduce((s, o) => s + o.amount, 0);

  type BuyerRow  = (typeof buyerOrders)[number];
  type SellerRow = (typeof sellerOrders)[number];
  const allRows: ({ direction: "sent" } & BuyerRow | { direction: "received" } & SellerRow)[] = [
    ...buyerOrders.map(o  => ({ ...o, direction: "sent"     as const })),
    ...sellerOrders.map(o => ({ ...o, direction: "received" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered =
    tab === "sent"     ? allRows.filter(r => r.direction === "sent") :
    tab === "received" ? allRows.filter(r => r.direction === "received") :
    tab === "pending"  ? allRows.filter(r => ["pending","accepted","funded"].includes(r.status)) :
    allRows;

  const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
    completed:   { bg: "rgba(34,197,94,0.12)",   text: "#16a34a", label: "Released"   },
    funded:      { bg: "rgba(20,184,166,0.12)",   text: "#0d9488", label: "Funded"    },
    delivered:   { bg: "rgba(107,114,128,0.12)",  text: "#6b7280", label: "Delivered" },
    accepted:    { bg: "rgba(99,102,241,0.12)",   text: "#6366f1", label: "Accepted"  },
    pending:     { bg: "rgba(245,158,11,0.12)",   text: "#d97706", label: "Pending"   },
    cancelled:   { bg: "rgba(107,114,128,0.12)",  text: "#9ca3af", label: "Cancelled" },
    disputed:    { bg: "rgba(239,68,68,0.12)",    text: "#ef4444", label: "Disputed"  },
  };

  const tabs = [
    { key: "all",      label: "All"      },
    { key: "sent",     label: "Sent"     },
    { key: "received", label: "Received" },
    { key: "pending",  label: "Pending"  },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#F2F2F7", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .ph-tab-active { background: #14B8A6 !important; color: #fff !important; }
        .ph-tx-row { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid #F2F2F7; text-decoration: none; color: inherit; transition: background 0.1s; }
        .ph-tx-row:last-child { border-bottom: none; }
        .ph-tx-row:hover { background: rgba(20,184,166,0.03); }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "clamp(5rem,10vw,6rem) 16px 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link href="/billing" style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "#1C1C1E", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexShrink: 0, fontSize: 16 }}>
            ‹
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1E", margin: 0 }}>Payment History</h1>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total Spent",   value: `$${spent.toFixed(2)}`,   color: "#ef4444", bg: "rgba(239,68,68,0.06)"   },
            { label: "Total Earned",  value: `$${earned.toFixed(2)}`,  color: "#16a34a", bg: "rgba(34,197,94,0.06)"   },
            { label: "In Escrow",     value: `$${pending.toFixed(2)}`, color: "#d97706", bg: "rgba(245,158,11,0.06)"  },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "14px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#8E8E93", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map(t => (
            <Link key={t.key} href={`/payments?tab=${t.key}`}
              className={tab === t.key ? "ph-tab-active" : ""}
              style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, fontWeight: 600, textDecoration: "none", background: "#fff", color: "#8E8E93", whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", flexShrink: 0 }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <circle cx="10" cy="9" r="1" fill="#14B8A6"/>
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginBottom: 6 }}>No transactions yet</div>
            <div style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.55 }}>Your payment history will appear here.</div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {filtered.map((row) => {
              const isSent = row.direction === "sent";
              const counterpart = isSent
                ? (row as typeof buyerOrders[number]  & { direction: "sent"     }).seller
                : (row as typeof sellerOrders[number] & { direction: "received" }).buyer;
              const sc = STATUS_META[row.status] ?? { bg: "rgba(0,0,0,0.06)", text: "#6b7280", label: row.status };
              const walletAddr = counterpart.walletAddress;
              const canRate = isSent && row.status === "completed";

              return (
                <div key={row.id + row.direction}>
                  <Link href={`/orders/${row.id}`} className="ph-tx-row">
                    {/* USDC icon */}
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="1.5"/>
                        <text x="16" y="21" textAnchor="middle" fill="#3B82F6" fontSize="12" fontWeight="800">$</text>
                      </svg>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
                        {row.gig.title}
                      </div>
                      {walletAddr && (
                        <div style={{ fontSize: 11, color: "#8E8E93", fontFamily: "monospace", marginBottom: 2 }}>
                          {walletAddr.slice(0, 6)}…{walletAddr.slice(-4)}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#8E8E93" }}>
                        {new Date(row.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                        {new Date(row.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {/* Amount + status */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#1C1C1E", marginBottom: 5 }}>
                        {row.amount.toFixed(2)} USDC
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                    </div>
                  </Link>

                  {/* Rate Freelancer CTA */}
                  {canRate && (
                    <Link href={`/orders/${row.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px 16px", textDecoration: "none", borderBottom: "1px solid #F2F2F7", background: "rgba(245,158,11,0.03)" }}>
                      <span style={{ fontSize: 15, color: "#f59e0b" }}>★</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>Rate Freelancer</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reports link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/payments/reports" style={{ fontSize: 13, color: "#14B8A6", fontWeight: 600, textDecoration: "none" }}>
            View Payment Reports →
          </Link>
        </div>

      </div>
    </main>
  );
}
