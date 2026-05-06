import Link from "next/link";

interface Props {
  status: string;
  amount: number;
  txHash: string | null;
  escrowAddress: string | null;
  isBuyer: boolean;
}

const STATES: Record<string, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  border: string;
  buyer: { what: string; next: string };
  seller: { what: string; next: string };
}> = {
  pending: {
    icon: <circle cx="12" cy="12" r="9" strokeDasharray="4 2"/>,
    label: "Not Funded",
    color: "#f59e0b", bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.2)",
    buyer:  { what: "No funds are locked yet.",              next: "Fund escrow to start work — payment stays locked until you approve delivery." },
    seller: { what: "The client hasn't funded escrow yet.",  next: "Work begins once the client locks payment in." },
  },
  funded: {
    icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    label: "Funds Locked",
    color: "#14b8a6", bg: "rgba(20,184,166,0.05)", border: "rgba(20,184,166,0.2)",
    buyer:  { what: "Payment is locked on-chain — secured until you approve delivery.",         next: "The freelancer will start work and submit a delivery." },
    seller: { what: "Payment is secured in escrow — guaranteed on delivery approval.",          next: "Start work and submit your delivery when done." },
  },
  accepted: {
    icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    label: "Locked — Work in Progress",
    color: "#3b82f6", bg: "rgba(59,130,246,0.05)", border: "rgba(59,130,246,0.2)",
    buyer:  { what: "Payment is locked and the freelancer is actively working.",          next: "You'll release payment when you approve the delivered work." },
    seller: { what: "Payment is secured. Deliver when ready.",                            next: "Submit your delivery through the Actions panel below." },
  },
  delivered: {
    icon: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    label: "Awaiting Your Release",
    color: "#8b5cf6", bg: "rgba(139,92,246,0.05)", border: "rgba(139,92,246,0.2)",
    buyer:  { what: "Work has been delivered. Funds are still held in escrow.",           next: "Review the delivery. Release payment if satisfied, or open a dispute." },
    seller: { what: "You've submitted your work. Funds release once the client approves.", next: "Payment releases automatically when the client approves." },
  },
  completed: {
    icon: <><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></>,
    label: "Payment Released",
    color: "#22c55e", bg: "rgba(34,197,94,0.05)", border: "rgba(34,197,94,0.2)",
    buyer:  { what: "Payment has been released to the freelancer.",            next: "Leave a review to help the community." },
    seller: { what: "Payment has been released to your wallet.",               next: "You can leave a review for the client." },
  },
  cancelled: {
    icon: <><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></>,
    label: "Refunded",
    color: "#94a3b8", bg: "rgba(148,163,184,0.05)", border: "rgba(148,163,184,0.2)",
    buyer:  { what: "Order cancelled. Any locked funds have been returned to your wallet.", next: "You can re-request the same service below." },
    seller: { what: "Order cancelled. No payment will be released.",                       next: "No further action required." },
  },
  disputed: {
    icon: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    label: "Funds Frozen — Dispute Open",
    color: "#ef4444", bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.2)",
    buyer:  { what: "A dispute is open. Funds are frozen pending resolution.",         next: "Add your evidence in the dispute thread. An admin will mediate." },
    seller: { what: "A dispute is open. Funds are frozen pending resolution.",         next: "Respond with evidence in the dispute thread. An admin will decide." },
  },
};

const FALLBACK = {
  icon: null, label: "Unknown", color: "#94a3b8", bg: "transparent", border: "var(--card-border)",
  buyer: { what: "—", next: "—" }, seller: { what: "—", next: "—" },
};

export default function EscrowState({ status, amount, txHash, escrowAddress, isBuyer }: Props) {
  const s = STATES[status] ?? FALLBACK;
  const copy = isBuyer ? s.buyer : s.seller;
  const fee = Math.floor((amount * 1_000) / 10_000);
  const net = amount - fee;

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${s.border}`, background: s.bg, overflow: "hidden" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", borderBottom: `1px solid ${s.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            {s.icon}
          </svg>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: s.color, letterSpacing: "0.04em" }}>{s.label}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>${amount} USDC</div>
          {!isBuyer && status !== "pending" && status !== "cancelled" && (
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 1 }}>
              You receive ${net} <span style={{ opacity: 0.7 }}>(10% fee: ${fee})</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0.9rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        {/* What */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, paddingTop: 2, minWidth: 52 }}>Now</span>
          <span style={{ fontSize: "0.78rem", color: "var(--foreground)", lineHeight: 1.55 }}>{copy.what}</span>
        </div>
        {/* Next */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, paddingTop: 2, minWidth: 52 }}>Next</span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{copy.next}</span>
        </div>

        {/* Chain links */}
        {(txHash || escrowAddress) && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            {txHash && (
              <Link
                href={`https://solscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${s.border}`, fontSize: "0.65rem", fontWeight: 600, color: s.color, textDecoration: "none" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Tx on Solscan
              </Link>
            )}
            {escrowAddress && (
              <Link
                href={`https://solscan.io/account/${escrowAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${s.border}`, fontSize: "0.65rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Escrow Account
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
