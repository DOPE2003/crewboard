"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

type Order = {
  id: string;
  amount: number;
  status: string;
  buyerId: string;
  createdAt: string;
  gig: { title: string } | null;
};

type CategoryStat = { category: string; total: number };
type MonthlyStat  = { month: string; total: number };

type Props = {
  walletAddress: string | null;
  totalEarned: number;
  totalPending: number;
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

/* ── Simple SVG bar chart ── */
function BarChart({ data, color = "#14B8A6" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 100 / data.length;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Bars */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6, padding: "0 4px" }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div
                  title={`${d.label}: ${fmt(d.value)}`}
                  style={{
                    width: "100%",
                    height: `${Math.max(pct, 2)}%`,
                    background: d.value > 0
                      ? `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
                      : "rgba(0,0,0,0.06)",
                    borderRadius: "6px 6px 3px 3px",
                    transition: "height 0.4s ease",
                    cursor: "default",
                    position: "relative",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div style={{ display: "flex", gap: 6, padding: "6px 4px 0" }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            fontSize: 10, color: "#9ca3af", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Horizontal bar (category breakdown) ── */
function HorizBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: "#14B8A6", fontWeight: 700 }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          borderRadius: 99,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

const CAT_COLORS = [
  "#14B8A6", "#6366f1", "#f59e0b", "#ec4899",
  "#3b82f6", "#10b981", "#8b5cf6", "#f97316",
];

export default function BillingClient({
  walletAddress, totalEarned, totalPending, userId, orders,
  earningsByCategory, monthlyEarnings,
}: Props) {
  const [copied, setCopied]               = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount]   = useState("");
  const [isTransferring, setIsTransferring]   = useState(false);
  const [transferError, setTransferError]     = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  function copyAddress() {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleTransfer() {
    if (!publicKey || !signTransaction || !connection) {
      setTransferError("Wallet not connected. Connect via Dashboard first.");
      return;
    }
    if (!transferAddress.trim() || !transferAmount) return;
    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(false);
    try {
      const { PublicKey, Transaction } = await import("@solana/web3.js");
      const { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
      const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
      const recipient = new PublicKey(transferAddress.trim());
      const senderATA    = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      const recipientATA = await getAssociatedTokenAddress(USDC_MINT, recipient);
      const amount = Math.round(parseFloat(transferAmount) * 1_000_000);
      const ix = createTransferInstruction(senderATA, recipientATA, publicKey, amount, [], TOKEN_PROGRAM_ID);
      const tx = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const signed = await signTransaction(tx);
      const sig    = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig);
      setTransferSuccess(true);
      setTransferAmount("");
      setTransferAddress("");
    } catch (err: unknown) {
      setTransferError((err as Error)?.message ?? "Transfer failed. Check address and balance.");
    } finally {
      setIsTransferring(false);
    }
  }

  const hasEarnings  = totalEarned > 0;
  const hasMonthly   = monthlyEarnings.some((m) => m.total > 0);
  const hasCategories = earningsByCategory.length > 0;
  const maxCat = earningsByCategory[0]?.total ?? 1;

  const monthlyChartData = monthlyEarnings.map((m) => ({ label: m.month, value: m.total }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #f7f8fa)", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        .wallet-grid { grid-template-columns: 1fr 1fr; }
        .wallet-stats { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 900px) {
          .wallet-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .billing-container { padding: 24px 16px 80px !important; }
          .wallet-stats { grid-template-columns: repeat(3, 1fr) !important; }
          .billing-stat-card { padding: 12px 8px !important; }
          .billing-stat-value { font-size: 18px !important; }
          .billing-wallet-card { padding: 20px 16px !important; border-radius: 16px !important; }
          .billing-wallet-address { font-size: 17px !important; }
          .billing-buttons { flex-wrap: wrap !important; gap: 8px !important; }
          .billing-buttons button,
          .billing-buttons a { flex: 1 !important; min-width: 120px !important; justify-content: center !important; min-height: 44px !important; }
          .billing-history-row { padding: 14px 16px !important; }
          .billing-history-title { font-size: 12px !important; }
          .billing-icon-box { width: 32px !important; height: 32px !important; font-size: 12px !important; }
        }
        @media (max-width: 380px) {
          .billing-stat-value { font-size: 15px !important; }
          .billing-wallet-address { font-size: 15px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <div className="billing-container" style={{ padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Account
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--foreground, #111827)", margin: "0 0 6px" }}>My Wallet</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              Manage your Solana wallet and payments
            </p>
          </div>

          {/* Two-column grid */}
          <div className="wallet-grid" style={{ display: "grid", gap: 24, alignItems: "start" }}>

            {/* LEFT: wallet card + stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Wallet card */}
              <div className="billing-wallet-card" style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #065f46 100%)",
                borderRadius: 20,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3), 0 2px 8px rgba(0,0,0,0.2)",
              }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -20, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Connected Wallet
                </p>
                <p className="billing-wallet-address" style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "0.02em" }}>
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "No wallet connected"}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "0 0 20px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: walletAddress ? "#4ade80" : "#6b7280", display: "inline-block", flexShrink: 0 }} />
                  {walletAddress ? "Solana · Linked" : "Not connected"}
                </p>
                <div className="billing-buttons" style={{ display: "flex", gap: 10 }}>
                  {walletAddress ? (
                    <>
                      <button onClick={copyAddress} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 16px", color: "#ffffff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minHeight: 44 }}>
                        {copied ? "✓ Copied" : "Copy Address"}
                      </button>
                      {walletAddress && (
                        <a href={`https://solscan.io/account/${walletAddress}`} target="_blank" rel="noopener noreferrer"
                          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "10px 16px", color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>
                          Solscan ↗
                        </a>
                      )}
                    </>
                  ) : (
                    <a href="/dashboard" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 16px", color: "#ffffff", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: 44 }}>
                      Connect Wallet →
                    </a>
                  )}
                </div>
              </div>

              {/* Transfer Funds */}
              {walletAddress && (
                <div style={{ background: "var(--dropdown-bg, #ffffff)", border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 16, padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground, #111827)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#14B8A6" }}>↗</span> Transfer Funds
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Recipient */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Recipient Wallet Address
                      </label>
                      <input
                        type="text"
                        placeholder="Solana wallet address…"
                        value={transferAddress}
                        onChange={(e) => setTransferAddress(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 12px", boxSizing: "border-box",
                          border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 10,
                          fontSize: 12, fontFamily: "Space Mono, monospace",
                          background: "var(--background, #f7f8fa)", color: "var(--foreground, #111827)",
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Amount + Send */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Amount (USDC)
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          min="0"
                          step="0.01"
                          style={{
                            flex: 1, padding: "10px 12px",
                            border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 10,
                            fontSize: 13, background: "var(--background, #f7f8fa)",
                            color: "var(--foreground, #111827)", outline: "none",
                          }}
                        />
                        <button
                          onClick={handleTransfer}
                          disabled={isTransferring || !transferAddress.trim() || !transferAmount}
                          style={{
                            background: isTransferring || !transferAddress.trim() || !transferAmount ? "#9ca3af" : "#14B8A6",
                            color: "white", border: "none",
                            padding: "10px 18px", borderRadius: 10,
                            fontWeight: 700, fontSize: 13, cursor: isTransferring ? "not-allowed" : "pointer",
                            flexShrink: 0, minHeight: 44, transition: "background 0.15s",
                            fontFamily: "inherit",
                          }}
                        >
                          {isTransferring ? "Sending…" : "Send →"}
                        </button>
                      </div>
                    </div>

                    {transferError && (
                      <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{transferError}</p>
                    )}
                    {transferSuccess && (
                      <p style={{ fontSize: 12, color: "#16a34a", margin: 0, fontWeight: 600 }}>Transfer sent successfully.</p>
                    )}

                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
                      Transfers use your connected Solana wallet via Phantom. Make sure Phantom is unlocked before sending.
                    </p>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="wallet-stats" style={{ display: "grid", gap: 12 }}>
                {[
                  { label: "Total Earned", value: fmt(totalEarned), color: "#14B8A6" },
                  { label: "Pending",      value: fmt(totalPending), color: "#f59e0b" },
                  { label: "Withdrawn",    value: "$0",              color: "#6b7280" },
                ].map((stat) => (
                  <div key={stat.label} className="billing-stat-card" style={{ background: "var(--dropdown-bg, #ffffff)", border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
                    <p className="billing-stat-value" style={{ fontSize: 24, fontWeight: 800, color: stat.color, margin: "0 0 4px" }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Monthly earnings chart */}
              <div style={{ background: "var(--dropdown-bg, #ffffff)", border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 16, padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground, #111827)", margin: "0 0 2px", letterSpacing: "0.04em" }}>
                      Monthly Earnings
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Last 6 months</p>
                  </div>
                  {hasEarnings && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#14B8A6" }}>{fmt(totalEarned)}</span>
                  )}
                </div>
                <div style={{ height: 120 }}>
                  {hasMonthly ? (
                    <BarChart data={monthlyChartData} color="#14B8A6" />
                  ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ fontSize: 12, color: "#d1d5db", margin: 0 }}>No earnings yet</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT: category breakdown + payment history */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Category breakdown */}
              <div style={{ background: "var(--dropdown-bg, #ffffff)", border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 16, padding: "20px" }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground, #111827)", margin: "0 0 2px", letterSpacing: "0.04em" }}>
                    Earnings by Field
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Your income per service category</p>
                </div>

                {hasCategories ? (
                  <div>
                    {earningsByCategory.map((cat, i) => (
                      <HorizBar
                        key={cat.category}
                        label={cat.category}
                        value={cat.total}
                        max={maxCat}
                        color={CAT_COLORS[i % CAT_COLORS.length]}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "24px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "#d1d5db", margin: 0 }}>Complete orders to see your breakdown</p>
                  </div>
                )}
              </div>

              {/* Payment history */}
              <div style={{ background: "var(--dropdown-bg, #ffffff)", border: "1px solid var(--card-border, #e5e7eb)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border, #f3f4f6)" }}>
                  <h2 className="billing-history-title" style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground, #111827)", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Payment History
                  </h2>
                </div>

                {orders.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 32, margin: "0 0 12px" }}>💳</p>
                    <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>No transactions yet</p>
                  </div>
                ) : (
                  orders.map((order, i) => {
                    const isOutgoing = order.buyerId === userId;
                    return (
                      <div key={order.id} className="billing-history-row" style={{
                        padding: "16px 20px",
                        borderBottom: i < orders.length - 1 ? "1px solid var(--card-border, #f9fafb)" : "none",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <div className="billing-icon-box" style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: isOutgoing ? "#fef2f2" : "#f0fdfa",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, color: isOutgoing ? "#ef4444" : "#14B8A6",
                          }}>
                            {isOutgoing ? "↑" : "↓"}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground, #111827)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {order.gig?.title ? (order.gig.title.length > 36 ? order.gig.title.slice(0, 36) + "…" : order.gig.title) : "Order"}
                            </p>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px", color: isOutgoing ? "#ef4444" : "#14B8A6" }}>
                            {isOutgoing ? "-" : "+"}${order.amount}
                          </p>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                            background: order.status === "completed" ? "#dcfce7" : "#fef3c7",
                            color: order.status === "completed" ? "#16a34a" : "#d97706",
                          }}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
