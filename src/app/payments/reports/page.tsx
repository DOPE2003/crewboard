import { requireUserId } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import PaymentReportsClient from "./PaymentReportsClient";

export const metadata = { title: "Payment Reports — Crewboard" };

export default async function PaymentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; month?: string }>;
}) {
  const userId = await requireUserId();
  const { currency = "USD", month = "full" } = await searchParams;

  const [buyerOrders, sellerOrders] = await Promise.all([
    db.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      include: { gig: { select: { title: true, category: true } } },
    }),
    db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: { gig: { select: { title: true, category: true } } },
    }),
  ]);

  const now = new Date();
  const currentYear = now.getFullYear();

  // Filter by month
  function inPeriod(dateStr: Date): boolean {
    const d = new Date(dateStr);
    if (d.getFullYear() !== currentYear) return false;
    if (month === "full") return true;
    const monthIdx = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(month.toLowerCase());
    return monthIdx !== -1 && d.getMonth() === monthIdx;
  }

  const periodBuyerOrders  = buyerOrders.filter(o  => inPeriod(o.createdAt));
  const periodSellerOrders = sellerOrders.filter(o => inPeriod(o.createdAt));

  const received = periodSellerOrders.filter(o => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const sent     = periodBuyerOrders.filter(o  => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const inEscrow = [...periodBuyerOrders, ...periodSellerOrders].filter(o => ["funded","accepted"].includes(o.status)).reduce((s, o) => s + o.amount, 0);
  const net      = received - sent;

  // Currency conversion rates (approximate)
  const FX: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79 };
  const rate = FX[currency] ?? 1;
  const fxSymbol: Record<string, string> = { USD: "$", EUR: "€", GBP: "£" };
  const sym = fxSymbol[currency] ?? "$";

  function fmt(n: number) {
    const converted = n * rate;
    return `${sym}${converted.toFixed(2)} ${currency}`;
  }
  function fmtLocal(n: number) {
    if (currency === "USD") return "";
    return `${(n * rate).toFixed(2)} ${currency}`;
  }

  // All transactions in period
  type TxRow = {
    id: string; title: string; amount: number; status: string;
    direction: "received" | "sent"; date: string;
  };
  const allTx: TxRow[] = [
    ...periodSellerOrders.map(o => ({ id: o.id, title: o.gig?.title ?? "Order", amount: o.amount, status: o.status, direction: "received" as const, date: o.createdAt.toISOString() })),
    ...periodBuyerOrders.map(o  => ({ id: o.id, title: o.gig?.title ?? "Order", amount: o.amount, status: o.status, direction: "sent" as const, date: o.createdAt.toISOString() })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <main style={{ minHeight: "100vh", background: "#F2F2F7", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .rpt-pill { padding: 8px 18px; border-radius: 99px; font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; cursor: pointer; border: none; font-family: inherit; transition: all 0.15s; }
        .rpt-pill-active { background: rgba(20,184,166,0.12) !important; color: #14B8A6 !important; box-shadow: 0 0 0 1.5px #14B8A6; }
        .rpt-pill:not(.rpt-pill-active) { background: #fff; color: #8E8E93; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .rpt-tx { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid #F2F2F7; }
        .rpt-tx:last-child { border-bottom: none; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "clamp(5rem,10vw,6rem) 16px 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link href="/payments" style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "#1C1C1E", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexShrink: 0, fontSize: 16 }}>
            ‹
          </Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1E", margin: 0 }}>Payment Reports</h1>
        </div>

        {/* Info card */}
        <div style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.18)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0d9488", marginBottom: 4 }}>Your Personal Payment Report</div>
            <div style={{ fontSize: 12, color: "#0d9488", lineHeight: 1.6, opacity: 0.85 }}>
              Download your monthly or yearly transaction statement as PDF. This report is for your personal records only and is not shared with any third party, government, or financial institution.
            </div>
          </div>
        </div>

        {/* Download button */}
        <PaymentReportsClient currency={currency} month={month} />

        {/* Currency toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { key: "EUR", flag: "🇩🇪" },
            { key: "USD", flag: "🇺🇸" },
            { key: "GBP", flag: "🇬🇧" },
          ].map(c => (
            <Link key={c.key} href={`/payments/reports?currency=${c.key}&month=${month}`}
              className={`rpt-pill${currency === c.key ? " rpt-pill-active" : ""}`}
              style={{ flexShrink: 0 }}
            >
              {c.flag} {c.key}
            </Link>
          ))}
        </div>

        {/* Month filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
          {[{ key: "full", label: "Full Year" }, ...MONTHS.map(m => ({ key: m.toLowerCase(), label: m }))].map(m => (
            <Link key={m.key} href={`/payments/reports?currency=${currency}&month=${m.key}`}
              className={`rpt-pill${month === m.key ? " rpt-pill-active" : ""}`}
              style={{ flexShrink: 0 }}
            >
              {m.label}
            </Link>
          ))}
        </div>

        {/* Tax Summary */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "20px 18px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #F2F2F7" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🇩🇪</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E" }}>Tax Summary</span>
            </div>
            <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>
              {month === "full" ? `Full Year ${currentYear}` : `${MONTHS.find(m => m.toLowerCase() === month) ?? month} ${currentYear}`}
            </span>
          </div>

          {[
            { label: "Income (Received)", icon: "↓", iconBg: "rgba(34,197,94,0.12)", iconColor: "#16a34a", value: fmt(received), local: fmtLocal(received) },
            { label: "Sent (Paid)",       icon: "↑", iconBg: "rgba(239,68,68,0.12)", iconColor: "#ef4444", value: fmt(sent),     local: fmtLocal(sent) },
            { label: "In Escrow",         icon: "🔒",iconBg: "rgba(245,158,11,0.08)",iconColor: "#f59e0b", value: fmt(inEscrow), local: fmtLocal(inEscrow) },
          ].map((row, i) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < 2 ? "1px solid #F2F2F7" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: row.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: row.iconColor, flexShrink: 0 }}>
                  {row.icon}
                </div>
                <span style={{ fontSize: 14, color: "#3C3C43", fontWeight: 500 }}>{row.label}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>{row.value}</div>
                {row.local && <div style={{ fontSize: 11, color: "#8E8E93" }}>{row.local}</div>}
              </div>
            </div>
          ))}

          {/* Net Total */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, marginTop: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E" }}>Net Total</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: net >= 0 ? "#14B8A6" : "#ef4444" }}>{fmt(net)}</div>
              {fmtLocal(net) && <div style={{ fontSize: 11, color: "#8E8E93" }}>{fmtLocal(net)}</div>}
            </div>
          </div>

          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#F2F2F7" }}>
            <div style={{ fontSize: 11, color: "#8E8E93", lineHeight: 1.6 }}>
              ℹ️ This report is for your personal records only. Not shared with third parties.
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", margin: "0 0 12px" }}>
            Transactions ({allTx.length})
          </h2>
        </div>

        {allTx.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E", marginBottom: 6 }}>No transactions found</div>
            <div style={{ fontSize: 12, color: "#8E8E93" }}>
              {month === "full" ? "No activity this year yet." : `No activity in ${MONTHS.find(m => m.toLowerCase() === month) ?? month}.`}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "#8E8E93" }}>Pick a different month or year to see activity.</div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {allTx.map(tx => {
              const isReceived = tx.direction === "received";
              return (
                <Link key={tx.id + tx.direction} href={`/orders/${tx.id}`} className="rpt-tx" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isReceived ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: isReceived ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                    {isReceived ? "↓" : "↑"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{tx.title}</div>
                    <div style={{ fontSize: 11, color: "#8E8E93" }}>
                      {new Date(tx.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {tx.status}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isReceived ? "#16a34a" : "#1C1C1E" }}>
                      {isReceived ? "+" : "−"}{sym}{(tx.amount * rate).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: "#8E8E93" }}>{currency}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
