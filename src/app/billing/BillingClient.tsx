"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
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
  completed:   { bg: "rgba(34,197,94,0.1)",   text: "#16a34a" },
  funded:      { bg: "rgba(20,184,166,0.1)",   text: "#0d9488" },
  delivered:   { bg: "rgba(99,102,241,0.1)",   text: "#6366f1" },
  accepted:    { bg: "rgba(99,102,241,0.1)",   text: "#6366f1" },
  pending:     { bg: "rgba(245,158,11,0.1)",   text: "#d97706" },
  in_progress: { bg: "rgba(245,158,11,0.1)",   text: "#d97706" },
  cancelled:   { bg: "rgba(107,114,128,0.1)",  text: "#6b7280" },
  disputed:    { bg: "rgba(239,68,68,0.1)",    text: "#ef4444" },
  refunded:    { bg: "rgba(239,68,68,0.1)",    text: "#ef4444" },
};

/** True on phones/tablets */
function detectMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

function phantomDeepLink(url: string): string {
  return (
    "https://phantom.app/ul/browse/" +
    encodeURIComponent(url) +
    "?ref=" +
    encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")
  );
}

export default function BillingClient({
  walletAddress, totalEarned, totalFees, inEscrow, pendingRelease,
  userId, orders, earningsByCategory, monthlyEarnings,
}: Props) {
  const router = useRouter();

  const [copied, setCopied]                   = useState(false);
  const [filter, setFilter]                   = useState<HistoryFilter>("all");
  const [showTransfer, setShowTransfer]       = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount]   = useState("");
  const [isTransferring, setIsTransferring]   = useState(false);
  const [transferError, setTransferError]     = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferConfirm, setTransferConfirm] = useState(false);
  const [isMobile, setIsMobile]               = useState(false);
  // Tracks whether Phantom is available + connected (for signing only)
  const [isPhantomConnected, setIsPhantomConnected] = useState(false);
  const [disconnecting, setDisconnecting]     = useState(false);

  const { publicKey, connected, signTransaction, select, disconnect } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    setIsMobile(detectMobile());
  }, []);

  // Keep isPhantomConnected in sync after mount (window not available SSR)
  useEffect(() => {
    const provider =
      (window as any).phantom?.solana ??
      ((window as any).solana?.isPhantom ? (window as any).solana : null);
    const check = () =>
      setIsPhantomConnected(!!(provider?.isConnected || (connected && publicKey)));
    check();
    provider?.on?.("connect",    check);
    provider?.on?.("disconnect", check);
    return () => {
      provider?.off?.("connect",    check);
      provider?.off?.("disconnect", check);
    };
  }, [connected, publicKey]);

  // Auto-save wallet to DB when Phantom connects and no address is stored yet
  useEffect(() => {
    if (walletAddress) return; // DB already has an address — don't overwrite
    const provider =
      (window as any).phantom?.solana ??
      ((window as any).solana?.isPhantom ? (window as any).solana : null);
    const save = (pk: string) =>
      linkWallet({ publicKey: pk }).then(() => window.location.reload()).catch(console.error);
    if (connected && publicKey) { save(publicKey.toBase58()); return; }
    if (provider?.isConnected && provider?.publicKey) { save(provider.publicKey.toBase58()); return; }
    const onConnect = () => { const pk = provider?.publicKey?.toBase58(); if (pk) save(pk); };
    provider?.on?.("connect", onConnect);
    return () => provider?.off?.("connect", onConnect);
  }, [connected, publicKey, walletAddress]);

  // ── DB is source of truth for wallet ownership ─────────────────────────────
  const hasWallet = !!walletAddress;
  // Display address: prefer what's stored in DB; fall back to live adapter key
  const addr = walletAddress ?? ((connected && publicKey) ? publicKey.toBase58() : null);

  function copyAddress() {
    if (!addr) return;
    navigator.clipboard.writeText(addr).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function handleConnectWallet() {
    // On mobile without Phantom injected → deep-link into Phantom browser
    if (isMobile) {
      const provider =
        (window as any).phantom?.solana ??
        ((window as any).solana?.isPhantom ? (window as any).solana : null);
      if (!provider) {
        window.location.href = phantomDeepLink(window.location.href);
        return;
      }
    }
    const provider =
      (window as any).phantom?.solana ??
      ((window as any).solana?.isPhantom ? (window as any).solana : null);
    if (!provider) {
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await provider.connect();
      select("Phantom" as WalletName);
    } catch (e: any) {
      if (e?.code !== 4001) console.error("connect error", e);
    }
  }

  async function handleDisconnectWallet() {
    if (!confirm("Disconnect your wallet?")) return;
    setDisconnecting(true);
    try {
      // 1. Disconnect adapter
      await disconnect();
      // 2. Disconnect raw Phantom provider
      const provider =
        (window as any).phantom?.solana ??
        ((window as any).solana?.isPhantom ? (window as any).solana : null);
      try { await provider?.disconnect(); } catch { /* ignore */ }
      // 3. Clear wallet-adapter localStorage key
      try { localStorage.removeItem("walletName"); } catch { /* ignore */ }
      // 4. Remove address from DB
      await unlinkWallet();
      // 5. Go to dashboard — NOT back to billing (wallet is now gone)
      router.push("/dashboard");
    } catch {
      setDisconnecting(false);
    }
  }

  async function handleTransfer() {
    if (!publicKey || !signTransaction || !connection) {
      setTransferError("Connect Phantom to send funds."); return;
    }
    const addr = transferAddress.trim();
    const amt  = parseFloat(transferAmount);
    if (!addr || isNaN(amt) || amt <= 0) return;
    setIsTransferring(true); setTransferError(null); setTransferSuccess(false);
    try {
      const { PublicKey, Transaction } = await import("@solana/web3.js");
      const { createTransferInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getAccount, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = await import("@solana/spl-token");
      let recipient: InstanceType<typeof PublicKey>;
      try { recipient = new PublicKey(addr); } catch { setTransferError("Invalid Solana address."); setIsTransferring(false); return; }
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

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o) => STATUS_GROUPS[filter].includes(o.status));

  const FILTERS: HistoryFilter[] = ["all", "completed", "pending", "cancelled"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "Inter, sans-serif", overflowX: "hidden" }}>
      <style>{`
        .wallet-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 1.5rem;
          align-items: start;
        }
        .wallet-sidebar {
          position: sticky;
          top: 110px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        /* Mobile: stack sidebar above history */
        @media (max-width: 860px) {
          .wallet-layout {
            grid-template-columns: 1fr !important;
            display: flex !important;
            flex-direction: column-reverse !important;
          }
          .wallet-sidebar { position: static !important; }
        }
        /* Payment row: stack vertically on small screens */
        .pay-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.9rem 1.25rem;
        }
        .pay-row-body { flex: 1; min-width: 0; }
        .pay-row-right { text-align: right; flex-shrink: 0; }
        @media (max-width: 540px) {
          .pay-row {
            flex-wrap: wrap;
            gap: 10px;
            padding: 0.9rem 1rem;
          }
          .pay-row-right {
            text-align: left;
            order: 3;
            flex-basis: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "clamp(1.5rem,5vw,4rem) clamp(1rem,4vw,1.5rem) 5rem" }}>

        {/* Page title */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#14b8a6", marginBottom: "0.4rem" }}>
            Wallet & Payments
          </div>
          <h1 style={{ fontSize: "clamp(1.3rem,3vw,1.85rem)", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>
            My Wallet
          </h1>
        </div>

        <div className="wallet-layout">

          {/* ── LEFT: Payment history ── */}
          <div style={{ minWidth: 0 }}>
            <div style={{ borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--card-border)", overflow: "hidden" }}>

              {/* Header + filters */}
              <div style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--foreground)" }}>
                  Payment History
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {FILTERS.map((f) => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: "4px 11px", borderRadius: 99,
                      border: "1px solid var(--card-border)",
                      fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                      background: filter === f ? "#14b8a6" : "transparent",
                      color: filter === f ? "#fff" : "var(--text-muted)",
                      textTransform: "capitalize" as const, fontFamily: "inherit",
                      transition: "background 0.15s, color 0.15s",
                    }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {filteredOrders.length === 0 ? (
                <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  No {filter === "all" ? "" : filter} transactions yet.
                </div>
              ) : (
                <div>
                  {filteredOrders.map((order, i) => {
                    const isOut = order.buyerId === userId;
                    const sc = STATUS_COLOR[order.status] ?? { bg: "rgba(0,0,0,0.05)", text: "#6b7280" };
                    const amtColor = order.status === "pending" || order.status === "funded"
                      ? "#f59e0b"
                      : isOut ? "#ef4444" : "#22c55e";
                    return (
                      <div
                        key={order.id}
                        className="pay-row"
                        style={{ borderBottom: i < filteredOrders.length - 1 ? "1px solid var(--card-border)" : "none" }}
                      >
                        {/* Direction icon */}
                        <div style={{
                          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                          background: isOut ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 15, color: isOut ? "#ef4444" : "#22c55e", fontWeight: 700,
                        }}>
                          {isOut ? "↑" : "↓"}
                        </div>

                        {/* Title + meta */}
                        <div className="pay-row-body">
                          <div style={{ fontSize: "0.83rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.gig?.title ?? "Order"}
                          </div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: amtColor, fontFamily: "Space Mono, monospace", marginTop: "0.15rem" }}>
                            {isOut ? "−" : "+"}${isOut ? order.amount : Math.floor(order.amount * 0.9)}
                            {!isOut && order.status === "completed" && (
                              <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>
                                (${order.amount} - ${Math.floor(order.amount * 0.1)} fee)
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "0.25rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: sc.bg, color: sc.text, textTransform: "capitalize" as const }}>
                              {order.status}
                            </span>
                            <span style={{ fontSize: "0.63rem", color: "var(--text-muted)" }}>
                              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              {order.gig?.category && <> · {order.gig.category}</>}
                            </span>
                          </div>
                        </div>

                        {/* View link */}
                        <Link href={`/orders/${order.id}`} style={{
                          flexShrink: 0, padding: "6px 12px", borderRadius: 8,
                          fontSize: "0.66rem", fontWeight: 600, textDecoration: "none",
                          border: "1px solid var(--card-border)", color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}>
                          View →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="wallet-sidebar">

            {/* Balance cards */}
            {[
              { label: "Total Earned",    value: fmt(totalEarned),    color: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.2)",   note: totalFees > 0 ? `After ${fmt(totalFees)} platform fee (10%)` : "From completed orders (after 10% fee)",    icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/> },
              { label: "In Escrow",       value: fmt(inEscrow),       color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)",  note: "Locked in smart contract", icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> },
              { label: "Pending Release", value: fmt(pendingRelease), color: "#6366f1", bg: "rgba(99,102,241,0.07)",  border: "rgba(99,102,241,0.2)",  note: "Awaiting client approval", icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
            ].map((s) => (
              <div key={s.label} style={{ borderRadius: 14, padding: "1.1rem 1.15rem", background: s.bg, border: `1px solid ${s.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "0.5rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: s.color }}>{s.label}</span>
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--foreground)", fontFamily: "Space Mono, monospace", lineHeight: 1, marginBottom: "0.3rem" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{s.note}</div>
              </div>
            ))}

            {/* Wallet card */}
            <div style={{
              borderRadius: 14, padding: "1.15rem",
              background: "linear-gradient(135deg,#0d9488 0%,#0f766e 50%,#065f46 100%)",
              position: "relative", overflow: "hidden",
              boxShadow: "0 6px 24px rgba(20,184,166,0.22)",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />

              <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.14em", textTransform: "uppercase" as const, marginBottom: "0.4rem" }}>
                Solana Wallet
              </div>

              {/* Address or placeholder */}
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", fontFamily: "Space Mono, monospace", marginBottom: "0.3rem", wordBreak: "break-all" }}>
                {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not connected"}
              </div>

              {/* Status dot — DB is source of truth */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: "0.9rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: hasWallet ? "#4ade80" : "#6b7280", display: "inline-block" }} />
                <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.65)" }}>
                  {hasWallet ? "Wallet Connected" : "No wallet linked"}
                </span>
              </div>

              {/* ── No wallet linked → show connect CTA ── */}
              {!hasWallet && (
                <button
                  onClick={handleConnectWallet}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "9px 16px", borderRadius: 10,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#fff", fontSize: "0.78rem", fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    marginBottom: "0.5rem",
                  }}
                >
                  Connect Wallet
                </button>
              )}

              {/* ── Wallet linked but Phantom not connected → secondary CTA for signing ── */}
              {hasWallet && !isPhantomConnected && (
                <button
                  onClick={handleConnectWallet}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 9,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.8)", fontSize: "0.7rem", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    marginBottom: "0.75rem",
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  Connect Phantom to send funds
                </button>
              )}

              {/* ── Wallet linked actions ── */}
              {hasWallet && addr && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={copyAddress} style={walletBtn}>{copied ? "✓ Copied" : "Copy"}</button>
                  <a href={`https://solscan.io/account/${addr}`} target="_blank" rel="noopener noreferrer" style={{ ...walletBtn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                    Solscan ↗
                  </a>
                  {isPhantomConnected && (
                    <button
                      onClick={() => { setShowTransfer(v => !v); setTransferError(null); setTransferConfirm(false); }}
                      style={{ ...walletBtn, background: "rgba(255,255,255,0.1)" }}
                    >
                      Send ↗
                    </button>
                  )}
                  <button
                    onClick={handleDisconnectWallet}
                    disabled={disconnecting}
                    style={{ ...walletBtn, background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.4)" }}
                  >
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              )}
            </div>

            {/* Send via wallet (collapsible) */}
            {showTransfer && (
              <div style={{ borderRadius: 14, padding: "1.1rem", background: "var(--card-bg)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <div style={{ display: "flex", gap: 8, padding: "0.65rem 0.85rem", borderRadius: 9, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: "0.9rem" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div style={{ fontSize: "0.68rem", color: "#ef4444", lineHeight: 1.6 }}>
                    <strong>Irreversible.</strong> Bypasses escrow — cannot be recovered.
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div>
                    <label style={labelStyle}>Recipient Address</label>
                    <input type="text" placeholder="Solana address…" value={transferAddress} onChange={(e) => setTransferAddress(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (USDC)</label>
                    <input type="number" placeholder="0.00" value={transferAmount} min="0" step="0.01" onChange={(e) => setTransferAmount(e.target.value)} style={inputStyle} />
                  </div>
                  <button
                    onClick={() => { if (!transferConfirm) { setTransferConfirm(true); return; } handleTransfer(); }}
                    disabled={isTransferring || !transferAddress.trim() || !transferAmount}
                    style={{
                      padding: "9px", borderRadius: 9, border: "none",
                      fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
                      background: transferConfirm ? "#ef4444" : "#14b8a6",
                      color: "#fff", fontFamily: "inherit",
                      opacity: (!transferAddress.trim() || !transferAmount) ? 0.45 : 1,
                    }}
                  >
                    {isTransferring ? "Sending…" : transferConfirm ? "Confirm — cannot undo" : "Send →"}
                  </button>
                  {transferError   && <div style={{ fontSize: "0.68rem", color: "#ef4444" }}>{transferError}</div>}
                  {transferSuccess && <div style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 600 }}>Sent successfully.</div>}
                </div>
              </div>
            )}

            {/* Escrow info */}
            <div style={{ borderRadius: 14, padding: "1.1rem", background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.6rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#14b8a6", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>How Escrow Works</span>
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
                Payments are locked in a <strong style={{ color: "var(--foreground)" }}>Solana smart contract</strong> when an order starts. Funds release only when you approve delivery. Disputes freeze funds until resolved.
              </p>
              {inEscrow > 0 && (
                <div style={{ marginTop: "0.6rem", fontSize: "0.7rem", fontWeight: 700, color: "#14b8a6" }}>
                  {fmt(inEscrow)} currently protected
                </div>
              )}
            </div>

          </div>
          {/* end sidebar */}

        </div>
      </div>
    </div>
  );
}

const walletBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: "0.7rem",
  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.6rem", fontWeight: 600, color: "var(--text-muted)",
  display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.06em",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", boxSizing: "border-box",
  border: "1px solid var(--card-border)", borderRadius: 9,
  fontSize: "0.78rem", background: "var(--background)", color: "var(--foreground)",
  outline: "none", fontFamily: "inherit",
};
