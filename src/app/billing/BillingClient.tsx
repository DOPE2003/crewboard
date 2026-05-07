"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { linkWallet, unlinkWallet } from "@/actions/wallet";
import Link from "next/link";

type Order = {
  id: string;
  amount: number;
  status: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  gig: { title: string; category: string | null } | null;
};
type CategoryStat = { category: string; total: number };
type MonthlyStat  = { month: string; total: number };

type Props = {
  walletAddress: string | null;
  totalEarned: number;
  totalFees: number;
  inEscrow: number;
  pendingRelease: number;
  userId: string;
  orders: Order[];
  earningsByCategory: CategoryStat[];
  monthlyEarnings: MonthlyStat[];
};

function fmt(n: number) {
  if (n === 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

type HistoryFilter = "all" | "completed" | "pending" | "cancelled";
const STATUS_GROUPS: Record<HistoryFilter, string[]> = {
  all:       [],
  completed: ["completed"],
  pending:   ["pending", "accepted", "funded", "delivered", "in_progress"],
  cancelled: ["cancelled", "disputed", "refunded"],
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  completed:   { bg: "rgba(34,197,94,0.15)",   text: "#16a34a" },
  funded:      { bg: "rgba(20,184,166,0.15)",   text: "#0d9488" },
  delivered:   { bg: "rgba(99,102,241,0.15)",   text: "#818cf8" },
  accepted:    { bg: "rgba(99,102,241,0.15)",   text: "#818cf8" },
  pending:     { bg: "rgba(245,158,11,0.15)",   text: "#f59e0b" },
  in_progress: { bg: "rgba(245,158,11,0.15)",   text: "#f59e0b" },
  cancelled:   { bg: "rgba(107,114,128,0.15)",  text: "#9ca3af" },
  disputed:    { bg: "rgba(239,68,68,0.15)",    text: "#ef4444" },
  refunded:    { bg: "rgba(239,68,68,0.15)",    text: "#ef4444" },
};

const CAT_COLORS = ["#7C3AED","#14B8A6","#F59E0B","#3B82F6","#EC4899","#10B981","#EF4444"];

function detectMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}
function phantomDeepLink(url: string): string {
  return "https://phantom.app/ul/browse/" + encodeURIComponent(url) + "?ref=" + encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "");
}

/* ── Bar Chart ─────────────────────────────────────────────────── */
function RevenueChart({ data, highlight }: { data: MonthlyStat[]; highlight?: number }) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const H = 110, barW = 32, gap = 12;
  const W = data.length * (barW + gap) - gap;
  const hiIdx = highlight ?? data.reduce((best, d, i) => d.total > data[best].total ? i : best, 0);

  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} style={{ width: "100%", height: "auto" }}>
      {data.map((d, i) => {
        const barH = Math.max((d.total / maxVal) * H, d.total > 0 ? 8 : 4);
        const x = i * (barW + gap);
        const y = H - barH;
        const isHi = i === hiIdx;
        return (
          <g key={i}>
            {/* Bar */}
            <rect x={x} y={y} width={barW} height={barH} rx={8}
              fill={isHi ? "#7C3AED" : "rgba(124,58,237,0.3)"}
              style={{ transition: "fill 0.2s" }}
            />
            {/* Tooltip bubble on highlight */}
            {isHi && d.total > 0 && (
              <>
                <rect x={x - 14} y={y - 28} width={barW + 28} height={20} rx={6} fill="#1e293b" />
                <text x={x + barW / 2} y={y - 14} textAnchor="middle" fill="white" fontSize={9} fontWeight={700}>
                  +{fmt(d.total)}
                </text>
                <circle cx={x + barW / 2} cy={y} r={4} fill="white" stroke="#7C3AED" strokeWidth={2} />
              </>
            )}
            {/* Month label */}
            <text x={x + barW / 2} y={H + 20} textAnchor="middle" fill="#6b7280" fontSize={9}>
              {d.month.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Donut Chart ────────────────────────────────────────────────── */
function DonutChart({ data }: { data: CategoryStat[] }) {
  const colored = data.slice(0, 6).map((d, i) => ({ ...d, color: CAT_COLORS[i] }));
  const total = colored.reduce((s, d) => s + d.total, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 120 120" width={120} height={120}>
        <circle cx={60} cy={60} r={45} fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth={18} />
        <text x={60} y={64} textAnchor="middle" fill="#6b7280" fontSize={10}>No data</text>
      </svg>
    );
  }
  const R = 45, circ = 2 * Math.PI * R;
  let cum = 0;
  return (
    <svg viewBox="0 0 120 120" width={120} height={120}>
      {colored.map((seg, i) => {
        const len = (seg.total / total) * circ;
        const offset = circ * 0.25 - cum;
        cum += len;
        return (
          <circle key={i} cx={60} cy={60} r={R} fill="none"
            stroke={seg.color} strokeWidth={18}
            strokeDasharray={`${len} ${circ - len}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        );
      })}
      {/* Center total */}
      <text x={60} y={57} textAnchor="middle" fill="var(--foreground)" fontSize={11} fontWeight={700}>{fmt(total)}</text>
      <text x={60} y={70} textAnchor="middle" fill="#6b7280" fontSize={8}>Total</text>
    </svg>
  );
}

export default function BillingClient({
  walletAddress, totalEarned, totalFees, inEscrow, pendingRelease,
  userId, orders, earningsByCategory, monthlyEarnings,
}: Props) {
  const router = useRouter();
  const [copied, setCopied]               = useState(false);
  const [filter, setFilter]               = useState<HistoryFilter>("all");
  const [showTransfer, setShowTransfer]   = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount]   = useState("");
  const [isTransferring, setIsTransferring]   = useState(false);
  const [transferError, setTransferError]     = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferConfirm, setTransferConfirm] = useState(false);
  const [isMobile, setIsMobile]           = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const { publicKey, connected, signTransaction, disconnect, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  useEffect(() => { setIsMobile(detectMobile()); }, []);

  useEffect(() => {
    if (walletAddress) return;
    if (connected && publicKey) {
      linkWallet({ publicKey: publicKey.toBase58() })
        .then(() => window.location.reload())
        .catch(console.error);
    }
  }, [connected, publicKey, walletAddress]);

  const hasWallet = !!walletAddress;
  const addr = walletAddress ?? ((connected && publicKey) ? publicKey.toBase58() : null);

  function copyAddress() {
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function handleConnectWallet() {
    if (isMobile && !wallets.some(w => w.readyState === "Installed")) {
      window.location.href = phantomDeepLink(window.location.href); return;
    }
    setVisible(true);
  }

  async function handleDisconnectWallet() {
    if (!confirm("Disconnect your wallet?")) return;
    setDisconnecting(true);
    try {
      await disconnect();
      try { localStorage.removeItem("walletName"); } catch { /* noop */ }
      await unlinkWallet();
      router.push("/dashboard");
    } catch { setDisconnecting(false); }
  }

  async function handleTransfer() {
    if (!publicKey || !signTransaction || !connection) { setTransferError("Connect Phantom to send funds."); return; }
    const destAddr = transferAddress.trim();
    const amt = parseFloat(transferAmount);
    if (!destAddr || isNaN(amt) || amt <= 0) return;
    setIsTransferring(true); setTransferError(null); setTransferSuccess(false);
    try {
      const { PublicKey, Transaction } = await import("@solana/web3.js");
      const { createTransferInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
      let recipient: InstanceType<typeof PublicKey>;
      try { recipient = new PublicKey(destAddr); } catch { setTransferError("Invalid Solana address."); setIsTransferring(false); return; }
      const USDC_MINT    = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const senderATA    = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const recipientATA = await getAssociatedTokenAddress(USDC_MINT, recipient);
      const tx = new Transaction();
      try { await getAccount(connection, recipientATA); } catch {
        tx.add(createAssociatedTokenAccountInstruction(publicKey, recipientATA, recipient, USDC_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID));
      }
      tx.add(createTransferInstruction(senderATA, recipientATA, publicKey, Math.round(amt * 1_000_000), [], TOKEN_PROGRAM_ID));
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash; tx.feePayer = publicKey;
      const signed = await signTransaction(tx);
      const sig    = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      setTransferSuccess(true); setTransferAmount(""); setTransferAddress(""); setShowTransfer(false); setTransferConfirm(false);
    } catch (err: unknown) {
      const msg = (err as Error)?.message ?? "";
      setTransferError(msg.includes("User rejected") ? "Cancelled." : msg.includes("insufficient") ? "Insufficient USDC balance." : msg || "Transfer failed.");
    } finally { setIsTransferring(false); }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter(o => STATUS_GROUPS[filter].includes(o.status));
  const FILTERS: HistoryFilter[] = ["all", "completed", "pending", "cancelled"];

  const incomeThisMonth = (() => {
    const now = new Date();
    const key = now.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return monthlyEarnings.find(m => m.month === key)?.total ?? 0;
  })();
  const prevMonthIncome = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return monthlyEarnings.find(m => m.month === key)?.total ?? 0;
  })();
  const incomeChange = prevMonthIncome > 0 ? Math.round(((incomeThisMonth - prevMonthIncome) / prevMonthIncome) * 100) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        .billing-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .billing-right { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 900px) {
          .billing-grid { grid-template-columns: 1fr; }
          .billing-right { position: static; }
        }
        .stat-card { border-radius: 16px; padding: 18px 20px; border: 1px solid var(--card-border); background: var(--card-bg); }
        .tx-row { display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: default; transition: background 0.1s; }
        .tx-row:hover { background: rgba(124,58,237,0.04); }
        .filter-pill { padding: 6px 14px; border-radius: 99px; border: 1px solid var(--card-border); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .filter-pill.active { background: #7C3AED; color: #fff; border-color: #7C3AED; }
        .filter-pill:not(.active) { background: transparent; color: var(--text-muted); }
        .wallet-card-btn { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; padding: 6px 12px; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(1.5rem,4vw,3rem) clamp(1rem,3vw,1.5rem) 5rem" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 4 }}>
            Wallet & Payments
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            My Dashboard
          </h1>
        </div>

        {/* ── Top stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total Earned",    value: fmt(totalEarned),    note: `After ${fmt(totalFees)} platform fee`,  color: "#22c55e",  bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
            { label: "In Escrow",       value: fmt(inEscrow),       note: "Locked in smart contract",               color: "#f59e0b",  bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
            { label: "Pending Release", value: fmt(pendingRelease), note: "Awaiting client approval",               color: "#818cf8",  bg: "rgba(99,102,241,0.08)",  border: "rgba(99,102,241,0.2)" },
          ].map(s => (
            <div key={s.label} style={{ borderRadius: 16, padding: "16px 18px", background: s.bg, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: s.color, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: "clamp(1.2rem,2.5vw,1.7rem)", fontWeight: 800, color: "var(--foreground)", fontFamily: "Space Mono, monospace", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>{s.note}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="billing-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Revenue Flow chart */}
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Revenue Flow</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Last 6 months</div>
                </div>
                <Link href="/payments" style={{ fontSize: 11, fontWeight: 600, color: "#7C3AED", textDecoration: "none" }}>
                  View All →
                </Link>
              </div>

              {/* Y-axis labels + chart */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: 28, minWidth: 32 }}>
                  {[...Array(4)].map((_, i) => {
                    const maxVal = Math.max(...monthlyEarnings.map(d => d.total), 1);
                    const label = fmt(Math.round(maxVal * (3 - i) / 3));
                    return <div key={i} style={{ fontSize: 9, color: "#6b7280", textAlign: "right" }}>{label}</div>;
                  })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <RevenueChart data={monthlyEarnings} />
                </div>
              </div>

              {/* Filter pills below chart */}
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {FILTERS.map(f => (
                  <button key={f} className={`filter-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment history */}
            <div className="stat-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Payment History</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {filteredOrders.length} transaction{filteredOrders.length !== 1 ? "s" : ""}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  No {filter === "all" ? "" : filter} transactions yet.
                </div>
              ) : (
                <div>
                  {filteredOrders.map((order, i) => {
                    const isOut = order.buyerId === userId;
                    const sc = STATUS_COLOR[order.status] ?? { bg: "rgba(0,0,0,0.05)", text: "#6b7280" };
                    const amtColor = ["pending", "funded"].includes(order.status) ? "#f59e0b" : isOut ? "#ef4444" : "#22c55e";
                    const netAmt = isOut ? order.amount : Math.floor(order.amount * 0.9);
                    return (
                      <div key={order.id} className="tx-row"
                        style={{ borderBottom: i < filteredOrders.length - 1 ? "1px solid var(--card-border)" : "none" }}>

                        {/* Icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: isOut ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, color: isOut ? "#ef4444" : "#22c55e",
                        }}>
                          {isOut ? "↑" : "↓"}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.gig?.title ?? "Order"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.text, textTransform: "capitalize" }}>
                              {order.status}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {order.gig?.category && <> · {order.gig.category}</>}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: amtColor, fontFamily: "Space Mono, monospace" }}>
                            {isOut ? "−" : "+"}${netAmt}
                          </div>
                          {!isOut && order.status === "completed" && (
                            <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>
                              −${Math.floor(order.amount * 0.1)} fee
                            </div>
                          )}
                        </div>

                        {/* View */}
                        <Link href={`/orders/${order.id}`} style={{
                          marginLeft: 10, flexShrink: 0, padding: "5px 10px", borderRadius: 8,
                          fontSize: 11, fontWeight: 600, textDecoration: "none",
                          border: "1px solid var(--card-border)", color: "var(--text-muted)",
                        }}>
                          →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="billing-right">

            {/* Wallet credit card */}
            <div style={{
              borderRadius: 20, padding: "22px 20px",
              background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #065f46 100%)",
              position: "relative", overflow: "hidden",
              boxShadow: "0 12px 40px rgba(20,184,166,0.3)",
            }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -40, right: -40, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -30, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Solana Wallet
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: hasWallet ? "#4ade80" : "#6b7280" }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{hasWallet ? "Connected" : "Not linked"}</span>
                </div>
              </div>

              {/* Total balance */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>Total Balance</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontFamily: "Space Mono, monospace", lineHeight: 1 }}>
                  {fmt(totalEarned + inEscrow + pendingRelease)}
                </div>
              </div>

              {/* Address */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", fontFamily: "Space Mono, monospace", marginBottom: 16, letterSpacing: "0.08em" }}>
                {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not connected"}
              </div>

              {/* Actions */}
              {!hasWallet ? (
                <button onClick={handleConnectWallet} className="wallet-card-btn" style={{ width: "100%", padding: "10px", textAlign: "center" }}>
                  Connect Wallet
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={copyAddress} className="wallet-card-btn">{copied ? "✓ Copied" : "Copy"}</button>
                  <a href={`https://solscan.io/account/${addr}`} target="_blank" rel="noopener noreferrer" className="wallet-card-btn" style={{ textDecoration: "none" }}>
                    Solscan ↗
                  </a>
                  {connected && (
                    <button onClick={() => { setShowTransfer(v => !v); setTransferError(null); setTransferConfirm(false); }} className="wallet-card-btn">
                      Send ↗
                    </button>
                  )}
                  {!connected && (
                    <button onClick={handleConnectWallet} className="wallet-card-btn" style={{ background: "rgba(255,255,255,0.1)" }}>
                      Sign in
                    </button>
                  )}
                  <button onClick={handleDisconnectWallet} disabled={disconnecting} className="wallet-card-btn" style={{ background: "rgba(239,68,68,0.3)", borderColor: "rgba(239,68,68,0.5)" }}>
                    {disconnecting ? "…" : "Disconnect"}
                  </button>
                </div>
              )}
            </div>

            {/* Send transfer (expandable) */}
            {showTransfer && (
              <div className="stat-card" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
                <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: 14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.6 }}><strong>Irreversible.</strong> Bypasses escrow.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Recipient Address</label>
                    <input type="text" placeholder="Solana address…" value={transferAddress} onChange={e => setTransferAddress(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (USDC)</label>
                    <input type="number" placeholder="0.00" value={transferAmount} min="0" step="0.01" onChange={e => setTransferAmount(e.target.value)} style={inputStyle} />
                  </div>
                  <button
                    onClick={() => { if (!transferConfirm) { setTransferConfirm(true); return; } handleTransfer(); }}
                    disabled={isTransferring || !transferAddress.trim() || !transferAmount}
                    style={{ padding: "9px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: transferConfirm ? "#ef4444" : "#7C3AED", color: "#fff", fontFamily: "inherit", opacity: (!transferAddress.trim() || !transferAmount) ? 0.45 : 1 }}
                  >
                    {isTransferring ? "Sending…" : transferConfirm ? "Confirm — cannot undo" : "Send →"}
                  </button>
                  {transferError   && <div style={{ fontSize: 11, color: "#ef4444" }}>{transferError}</div>}
                  {transferSuccess && <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>Sent successfully.</div>}
                </div>
              </div>
            )}

            {/* Income / Expense mini cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="stat-card" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Income</div>
                  {incomeChange !== null && (
                    <div style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: incomeChange >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: incomeChange >= 0 ? "#22c55e" : "#ef4444" }}>
                      {incomeChange >= 0 ? "+" : ""}{incomeChange}%
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>{fmt(incomeThisMonth)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>This month</div>
              </div>
              <div className="stat-card" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Fees Paid</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>{fmt(totalFees)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Platform 10%</div>
              </div>
            </div>

            {/* Earnings breakdown donut */}
            <div className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>By Category</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Earnings</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <DonutChart data={earningsByCategory} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {earningsByCategory.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>No earnings yet</div>
                  ) : earningsByCategory.slice(0, 5).map((d, i) => (
                    <div key={d.category} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: CAT_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.category}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)", fontFamily: "Space Mono, monospace" }}>{fmt(d.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Escrow info */}
            <div className="stat-card" style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#14b8a6", letterSpacing: "0.1em", textTransform: "uppercase" }}>How Escrow Works</span>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                Payments lock in a <strong style={{ color: "var(--foreground)" }}>Solana smart contract</strong>. Funds release only when you approve delivery.
              </p>
              {inEscrow > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#14b8a6" }}>
                  {fmt(inEscrow)} currently protected
                </div>
              )}
            </div>

          </div>
          {/* end right */}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
  display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", boxSizing: "border-box",
  border: "1px solid var(--card-border)", borderRadius: 10,
  fontSize: 13, background: "var(--background)", color: "var(--foreground)",
  outline: "none", fontFamily: "inherit",
};
