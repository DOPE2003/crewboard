"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { linkWallet, unlinkWallet } from "@/actions/wallet";
import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";

type Order = {
  id: string;
  amount: number;
  status: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  gig: { title: string; category: string | null } | null;
};

type Props = {
  walletAddress: string | null;
  totalEarned: number;
  totalFees: number;
  inEscrow: number;
  pendingRelease: number;
  userId: string;
  orders: Order[];
  earningsByCategory: { category: string; total: number }[];
  monthlyEarnings: { month: string; total: number }[];
};

function detectMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}
function phantomDeepLink(url: string): string {
  return "https://phantom.app/ul/browse/" + encodeURIComponent(url) + "?ref=" + encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "");
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  completed:   { bg: "rgba(34,197,94,0.12)",   text: "#16a34a", label: "Released"   },
  funded:      { bg: "rgba(20,184,166,0.12)",   text: "#0d9488", label: "Funded"    },
  delivered:   { bg: "rgba(107,114,128,0.12)",  text: "#6b7280", label: "Delivered" },
  accepted:    { bg: "rgba(99,102,241,0.12)",   text: "#6366f1", label: "Accepted"  },
  pending:     { bg: "rgba(245,158,11,0.12)",   text: "#d97706", label: "Pending"   },
  in_progress: { bg: "rgba(245,158,11,0.12)",   text: "#d97706", label: "Active"    },
  cancelled:   { bg: "rgba(107,114,128,0.12)",  text: "#9ca3af", label: "Cancelled" },
  disputed:    { bg: "rgba(239,68,68,0.12)",    text: "#ef4444", label: "Disputed"  },
  refunded:    { bg: "rgba(239,68,68,0.12)",    text: "#ef4444", label: "Refunded"  },
};

export default function BillingClient({ walletAddress, totalEarned, totalFees, inEscrow, pendingRelease, userId, orders }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferConfirm, setTransferConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const { publicKey, connected, signTransaction, disconnect, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  useEffect(() => { setIsMobile(detectMobile()); }, []);

  useEffect(() => {
    if (walletAddress) return;
    if (connected && publicKey) {
      linkWallet({ publicKey: publicKey.toBase58() }).then(() => window.location.reload()).catch(console.error);
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

  const sentOrders     = orders.filter(o => o.buyerId  === userId);
  const receivedOrders = orders.filter(o => o.sellerId === userId);
  const totalSent      = sentOrders.filter(o => o.status === "completed").reduce((s, o) => s + o.amount, 0);
  const transactionCount = orders.length;
  const activityBalance = totalEarned + inEscrow + pendingRelease;

  const displayOrders = activeTab === "sent" ? sentOrders : receivedOrders;

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F7", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .wallet-tab { flex: 1; padding: 12px 0; border: none; font-family: inherit; font-size: 14px; font-weight: 600; cursor: pointer; border-radius: 12px; transition: all 0.15s; }
        .wallet-tab.active { background: #14B8A6; color: #fff; box-shadow: 0 2px 8px rgba(20,184,166,0.3); }
        .wallet-tab:not(.active) { background: transparent; color: #6b7280; }
        .tx-row { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid #F2F2F7; cursor: default; }
        .tx-row:last-child { border-bottom: none; }
        @media (max-width: 600px) { .wallet-actions { flex-wrap: wrap !important; } }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "clamp(5rem,10vw,6rem) 16px 6rem" }}>

        {/* ── Balance card ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 20px", marginBottom: 14, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {/* USDC gradient circle */}
          <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px", background: "linear-gradient(135deg, #a78bfa 0%, #14B8A6 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(20,184,166,0.3)" }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>USDC</span>
          </div>
          <div style={{ fontSize: 13, color: "#8E8E93", fontWeight: 500, marginBottom: 8 }}>Activity Balance</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#1C1C1E", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {activityBalance.toFixed(2)} USDC
          </div>

          {/* Wallet address row */}
          {addr && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#8E8E93", fontFamily: "monospace" }}>
                {addr.slice(0, 6)}…{addr.slice(-4)}
              </span>
              <button onClick={copyAddress} style={{ fontSize: 11, color: "#14B8A6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
          )}
        </div>

        {/* ── Stats row ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
          {[
            { label: "Sent",         value: `${totalSent.toFixed(4)}`,  icon: "↑", iconBg: "rgba(239,68,68,0.12)",  iconColor: "#ef4444" },
            { label: "Received",     value: `${totalEarned.toFixed(4)}`,icon: "↓", iconBg: "rgba(34,197,94,0.12)",  iconColor: "#22c55e" },
            { label: "Transactions", value: transactionCount.toString(), icon: "≡", iconBg: "rgba(20,184,166,0.12)", iconColor: "#14B8A6" },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid #F2F2F7" : "none", padding: "0 8px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 16, color: s.iconColor, fontWeight: 700 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1C1C1E", marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Wallet actions ── */}
        <div className="wallet-actions" style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {!hasWallet ? (
            <button onClick={handleConnectWallet} style={actionBtnStyle("#14B8A6", "#fff")}>
              Connect Wallet
            </button>
          ) : (
            <>
              {connected && (
                <button onClick={() => { setShowTransfer(v => !v); setTransferError(null); setTransferConfirm(false); }} style={actionBtnStyle("#1C1C1E", "#fff")}>
                  Send ↗
                </button>
              )}
              <a href={`https://solscan.io/account/${addr}`} target="_blank" rel="noopener noreferrer" style={{ ...actionBtnStyle("#F2F2F7", "#1C1C1E"), textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Solscan ↗
              </a>
              {!connected && (
                <button onClick={handleConnectWallet} style={actionBtnStyle("#F2F2F7", "#1C1C1E")}>Sign in</button>
              )}
              <button onClick={handleDisconnectWallet} disabled={disconnecting} style={actionBtnStyle("rgba(239,68,68,0.1)", "#ef4444")}>
                {disconnecting ? "…" : "Disconnect"}
              </button>
            </>
          )}
          <Link href="/payments" style={{ ...actionBtnStyle("#F2F2F7", "#1C1C1E"), textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            History
          </Link>
          <Link href="/payments/reports" style={{ ...actionBtnStyle("#F2F2F7", "#1C1C1E"), textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Reports
          </Link>
        </div>

        {/* ── Transfer panel ── */}
        {showTransfer && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "18px 16px", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.6 }}><strong>Irreversible.</strong> Bypasses escrow. Transfer directly to Solana wallet.</span>
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
                style={{ padding: "12px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", background: transferConfirm ? "#ef4444" : "#1C1C1E", color: "#fff", fontFamily: "inherit", opacity: (!transferAddress.trim() || !transferAmount) ? 0.45 : 1 }}
              >
                {isTransferring ? "Sending…" : transferConfirm ? "Confirm — cannot undo" : "Send →"}
              </button>
              {transferError   && <div style={{ fontSize: 12, color: "#ef4444" }}>{transferError}</div>}
              {transferSuccess && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>Sent successfully.</div>}
            </div>
          </div>
        )}

        {/* ── Tab toggle ── */}
        <div style={{ background: "#E5E5EA", borderRadius: 14, padding: 3, display: "flex", gap: 3, marginBottom: 14 }}>
          <button className={`wallet-tab${activeTab === "sent" ? " active" : ""}`} onClick={() => setActiveTab("sent")}>
            Sent ({sentOrders.length})
          </button>
          <button className={`wallet-tab${activeTab === "received" ? " active" : ""}`} onClick={() => setActiveTab("received")}>
            Received ({receivedOrders.length})
          </button>
        </div>

        {/* ── Transaction list ── */}
        {displayOrders.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {activeTab === "sent"
                  ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>}
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1C1C1E", marginBottom: 6 }}>
              {activeTab === "sent" ? "No payments sent yet" : "No payments received yet"}
            </div>
            <div style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.55 }}>
              {activeTab === "sent"
                ? "Hire a freelancer and your first payment will appear here."
                : "Complete an order and your earnings will appear here."}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {displayOrders.map((order) => {
              const isSent = order.buyerId === userId;
              const sc = STATUS_COLOR[order.status] ?? { bg: "rgba(0,0,0,0.06)", text: "#6b7280", label: order.status };
              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="tx-row" style={{ textDecoration: "none", color: "inherit" }}>
                  {/* USDC icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="rgba(59,130,246,0.15)" stroke="#3B82F6" strokeWidth="1.5"/>
                      <text x="12" y="16" textAnchor="middle" fill="#3B82F6" fontSize="8" fontWeight="700">$</text>
                    </svg>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                      {order.gig?.title ?? "Order"}
                    </div>
                    {addr && (
                      <div style={{ fontSize: 12, color: "#8E8E93", marginBottom: 3, fontFamily: "monospace" }}>
                        {addr.slice(0, 6)}…{addr.slice(-4)}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "#8E8E93" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {/* Amount + status */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1C1C1E", marginBottom: 5 }}>
                      {order.amount.toFixed(2)} USDC
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.text }}>
                      {sc.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Rate freelancer prompts */}
        {activeTab === "sent" && sentOrders.filter(o => o.status === "completed").length > 0 && (
          <div style={{ marginTop: 10, background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {sentOrders.filter(o => o.status === "completed").map(order => (
              <Link key={order.id + "_rate"} href={`/orders/${order.id}`} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 16px", textDecoration: "none", borderBottom: "1px solid #F2F2F7",
              }}>
                <span style={{ fontSize: 15, color: "#f59e0b" }}>★</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>Rate Freelancer</span>
              </Link>
            ))}
          </div>
        )}

        {/* Escrow status */}
        {(inEscrow > 0 || pendingRelease > 0) && (
          <div style={{ background: "#fff", borderRadius: 20, padding: "16px", marginTop: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {inEscrow > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: pendingRelease > 0 ? 12 : 0, marginBottom: pendingRelease > 0 ? 12 : 0, borderBottom: pendingRelease > 0 ? "1px solid #F2F2F7" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <span style={{ fontSize: 14, color: "#1C1C1E", fontWeight: 500 }}>In Escrow</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>${inEscrow.toFixed(2)} USDC</span>
              </div>
            )}
            {pendingRelease > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⏳</span>
                  <span style={{ fontSize: 14, color: "#1C1C1E", fontWeight: 500 }}>Pending Release</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#6366f1" }}>${pendingRelease.toFixed(2)} USDC</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function actionBtnStyle(bg: string, color: string): React.CSSProperties {
  return {
    flex: 1, minWidth: 80, padding: "11px 12px", borderRadius: 12, border: "none",
    background: bg, color, fontSize: 13, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", textAlign: "center",
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#8E8E93",
  display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", boxSizing: "border-box",
  border: "1px solid #E5E5EA", borderRadius: 12,
  fontSize: 14, background: "#F2F2F7", color: "#1C1C1E",
  outline: "none", fontFamily: "inherit",
};
