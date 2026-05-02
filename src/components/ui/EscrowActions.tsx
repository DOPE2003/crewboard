"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { fundEscrow, releaseFunds, markDelivered, deriveEscrowPDA, calcFee, USDC_MINT } from "@/lib/escrow";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { syncEscrowFunded, syncEscrowReleased, updateOrderStatus, requestRevision, resubmitWork } from "@/actions/orders";
import { openDispute } from "@/actions/disputes";

interface Props {
  orderId: string;
  orderStatus: string;
  orderAmount: number;
  isBuyer: boolean;
  isSeller: boolean;
  sellerWallet: string | null;
  buyerWallet: string | null;   // required for seller to derive escrow PDA
  txHash?: string | null;
}

function friendlyError(e: any): string {
  const msg: string = e?.message ?? String(e);
  if (msg.includes("no record of a prior credit") || msg.includes("Attempt to debit"))
    return "Your wallet has no SOL to pay the transaction fee.";
  if (msg.includes("insufficient funds") || msg.includes("0x1")) return "Insufficient USDC balance in your wallet";
  if (msg.toLowerCase().includes("rejected") || msg.includes("4001")) return "Transaction rejected by wallet";
  if (msg.includes("already in use") || msg.includes("already exists")) return "Escrow already funded for this order";
  return msg.slice(0, 160);
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
      borderRadius: "50%", animation: "escrow-spin 0.7s linear infinite", marginRight: 6,
    }} />
  );
}

// PhantomIcon, SolflareIcon, JupiterIcon — inline SVG so no external fetch can fail
function PhantomLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="128" height="128" rx="28" fill="#AB9FF2"/>
      <path d="M110.584 64.9142H99.142C99.142 44.0819 82.0796 27 61.275 27C40.7923 27 24 43.5955 24 64.0943C24 84.5 40.7923 101.912 61.275 101.912H65.1904C85.5515 101.912 98.5805 91.1228 105.943 77.7656C107.501 74.9152 109.037 71.5074 110.584 64.9142Z" fill="white"/>
      <ellipse cx="57.6" cy="63.5" rx="8.4" ry="9" fill="#AB9FF2"/>
      <ellipse cx="82.8" cy="63.5" rx="8.4" ry="9" fill="#AB9FF2"/>
    </svg>
  );
}

function SolflareLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="56" fill="#FC5B20"/>
      <path d="M128 40L196 160H60L128 40Z" fill="white" opacity="0.9"/>
      <path d="M128 216L60 160H196L128 216Z" fill="white"/>
    </svg>
  );
}

function JupiterLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="56" fill="#C7F284"/>
      <path d="M128 48L178 128L128 178L78 128L128 48Z" fill="#1A1A2E" opacity="0.85"/>
      <circle cx="128" cy="128" r="30" fill="#C7F284"/>
    </svg>
  );
}

const WALLET_META: { name: string; Logo: React.ComponentType }[] = [
  { name: "Phantom",  Logo: PhantomLogo  },
  { name: "Solflare", Logo: SolflareLogo },
  { name: "Jupiter",  Logo: JupiterLogo  },
];

function WalletPicker({ wallets, connecting, showPicker, setShowPicker, onSelect, style }: {
  wallets: { adapter: { name: string } }[];
  connecting: boolean;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  onSelect: (name: string) => void;
  style?: React.CSSProperties;
}) {
  if (!showPicker) {
    return (
      <button
        onClick={() => setShowPicker(true)}
        disabled={connecting}
        className="btn-primary"
        style={{ height: 40, borderRadius: 10, padding: "0 1.4rem", fontSize: "0.82rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...style }}
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "var(--text-muted)" }}>Choose a wallet:</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {WALLET_META.map(({ name, Logo }) => {
          const detected = wallets.some((w) => w.adapter.name === name);
          return (
            <button
              key={name}
              onClick={() => onSelect(name)}
              disabled={connecting || !detected}
              title={detected ? name : `${name} — not installed`}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8, fontSize: "0.78rem",
                cursor: detected ? "pointer" : "not-allowed",
                border: "1px solid var(--card-border)",
                background: "var(--dropdown-bg)", color: "var(--text)", fontWeight: 500,
                opacity: detected ? 1 : 0.45,
              }}
            >
              <Logo />
              {name}
            </button>
          );
        })}
        <button onClick={() => setShowPicker(false)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem", cursor: "pointer", border: "1px solid var(--card-border)", background: "transparent", color: "var(--text-muted)" }}>Cancel</button>
      </div>
    </div>
  );
}

// Retry an async fn up to `attempts` times with 1s delay between tries.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, label = ""): Promise<T> {
  let last: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      console.warn(`[EscrowActions] ${label} attempt ${i + 1} failed:`, e);
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw last;
}

export default function EscrowActions({
  orderId, orderStatus, orderAmount, isBuyer, isSeller, sellerWallet, buyerWallet, txHash,
}: Props) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions, connected, select, connect, connecting, wallets } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [balances, setBalances] = useState<{ sol: number; usdc: number } | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [disputeUrl, setDisputeUrl] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [disputeErr, setDisputeErr] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionMsg, setRevisionMsg] = useState("");
  const [resubmitMsg, setResubmitMsg] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [revisionErr, setRevisionErr] = useState("");

  const MIN_SOL = 0.005;

  useEffect(() => {
    if (!connected || !publicKey || orderStatus !== "pending" || !isBuyer) return;
    let cancelled = false;
    (async () => {
      try {
        const solLamports = await connection.getBalance(publicKey, "confirmed");
        const ata = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        let usdc = 0;
        try {
          const res = await connection.getTokenAccountBalance(ata);
          usdc = res.value.uiAmount ?? 0;
        } catch {} // no ATA = 0 USDC
        if (!cancelled) setBalances({ sol: solLamports / 1e9, usdc });
      } catch {} // non-blocking
    })();
    return () => { cancelled = true; };
  }, [connected, publicKey, orderStatus, isBuyer, connection]);

  const fundingInProgress = useRef(false);
  const recoveryChecked = useRef(false);

  const { sellerAmount, feeAmount } = calcFee(orderAmount);

  const anchorWallet = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return { publicKey, signTransaction, signAllTransactions };
  }, [publicKey, signTransaction, signAllTransactions]);

  const [showWalletPicker, setShowWalletPicker] = useState(false);

  // Connect a specific wallet by name, falling back to its install URL.
  const connectWallet = async (name: string) => {
    setShowWalletPicker(false);
    try {
      const w = wallets.find((w) => w.adapter.name === name);
      if (!w) return;
      select(w.adapter.name as any);
      await connect();
    } catch {
      const urls: Record<string, string> = {
        Phantom:  "https://phantom.app/",
        Solflare: "https://solflare.com/",
        Jupiter:  "https://jup.ag/",
      };
      if (urls[name]) window.open(urls[name], "_blank");
    }
  };

  // On page load: if escrow PDA exists on-chain but DB still shows "pending",
  // auto-sync the DB. Handles the case where a previous funding tx landed but
  // the syncEscrowFunded call never reached the server.
  useEffect(() => {
    if (recoveryChecked.current) return;
    if (!isBuyer || orderStatus !== "pending" || !sellerWallet || !anchorWallet) return;
    recoveryChecked.current = true;
    const check = async () => {
      try {
        const sellerPubkey = new PublicKey(sellerWallet);
        const [escrowPDA] = deriveEscrowPDA(anchorWallet.publicKey, sellerPubkey, orderId);
        const info = await connection.getAccountInfo(escrowPDA);
        if (info) {
          console.log("[EscrowActions] recovery: PDA found on-chain, auto-syncing DB");
          setLoading("fund:saving");
          await withRetry(
            () => syncEscrowFunded(orderId, "recovered", escrowPDA.toBase58()),
            3,
            "recovery-sync",
          );
          router.refresh();
        }
      } catch (e) {
        console.warn("[EscrowActions] recovery check failed (non-fatal):", e);
      } finally {
        setLoading(null);
      }
    };
    check();
  }, [isBuyer, orderStatus, sellerWallet, anchorWallet, orderId, connection, router]);

  // Whether this status requires an on-chain wallet tx
  const needsWallet =
    (isBuyer && orderStatus === "delivered") ||
    (isSeller && orderStatus === "accepted");

  async function handleDbAction(status: string) {
    setLoading(status);
    setError("");
    try {
      await updateOrderStatus(orderId, status);
      router.refresh();
    } catch (e: any) {
      setError(e.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleOpenDispute() {
    if (!disputeReason.trim() || !disputeDesc.trim()) return;
    setDisputeLoading(true); setDisputeErr("");
    try {
      const disputeId = await openDispute(orderId, disputeReason.trim(), disputeDesc.trim(), disputeUrl.trim() || undefined);
      router.push(`/disputes/${disputeId}`);
    } catch (e: any) {
      setDisputeErr(e.message ?? "Failed to open dispute.");
      setDisputeLoading(false);
    }
  }

  function DisputeFormInline() {
    if (!showDisputeForm) return (
      <button
        onClick={() => setShowDisputeForm(true)}
        disabled={!!loading}
        style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 600 }}
      >
        Open Dispute
      </button>
    );
    return (
      <div style={{ width: "100%", padding: "1rem", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444" }}>Open Dispute</span>
          <button onClick={() => setShowDisputeForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>×</button>
        </div>
        <input
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          placeholder="Short reason (e.g. Work not delivered)"
          maxLength={120}
          style={{ padding: "0.55rem 0.75rem", borderRadius: 7, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit" }}
        />
        <textarea
          value={disputeDesc}
          onChange={(e) => setDisputeDesc(e.target.value)}
          placeholder="Describe the issue in detail…"
          rows={3}
          style={{ resize: "vertical", padding: "0.55rem 0.75rem", borderRadius: 7, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit" }}
        />
        <input
          type="url"
          value={disputeUrl}
          onChange={(e) => setDisputeUrl(e.target.value)}
          placeholder="Evidence URL (optional)"
          style={{ padding: "0.55rem 0.75rem", borderRadius: 7, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit" }}
        />
        {disputeErr && <div style={{ fontSize: "0.72rem", color: "#ef4444" }}>{disputeErr}</div>}
        <button
          onClick={handleOpenDispute}
          disabled={disputeLoading || !disputeReason.trim() || !disputeDesc.trim()}
          style={{ alignSelf: "flex-end", padding: "0.55rem 1.25rem", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: disputeLoading || !disputeReason.trim() || !disputeDesc.trim() ? "not-allowed" : "pointer", opacity: disputeLoading || !disputeReason.trim() || !disputeDesc.trim() ? 0.6 : 1 }}
        >
          {disputeLoading ? "Opening…" : "Submit Dispute"}
        </button>
      </div>
    );
  }

  async function handleFundEscrow() {
    if (fundingInProgress.current) {
      console.warn("[EscrowActions] fund already in progress — ignoring duplicate click");
      return;
    }
    if (!anchorWallet) return setError("Connect your Solana wallet first");
    if (!sellerWallet) return setError("Seller has no wallet address on file");
    fundingInProgress.current = true;
    setError("");

    const sellerPubkey = new PublicKey(sellerWallet);
    const [escrowPDA] = deriveEscrowPDA(anchorWallet.publicKey, sellerPubkey, orderId);

    console.log("[EscrowActions] fund start", {
      orderId,
      buyer: anchorWallet.publicKey.toBase58(),
      seller: sellerPubkey.toBase58(),
      amount: orderAmount,
      rpc: connection.rpcEndpoint,
    });

    // ── Phase 1: sign + broadcast ──────────────────────────────────────────
    setLoading("fund:sending");
    let txSig: string;
    try {
      txSig = await fundEscrow(anchorWallet, connection, orderId, sellerPubkey, orderAmount);
      console.log("[EscrowActions] tx confirmed", txSig);
    } catch (e: any) {
      const msg: string = e?.message ?? "";

      // Tx already landed (user double-clicked / previous attempt timed out client-side)
      if (msg.includes("already been processed") || msg.includes("AlreadyInUse") || msg.includes("already in use")) {
        console.warn("[EscrowActions] tx already on-chain — syncing DB");
        setLoading("fund:saving");
        try {
          await withRetry(() => syncEscrowFunded(orderId, "recovered", escrowPDA.toBase58()), 3, "syncEscrowFunded(recovered)");
          router.refresh();
        } finally {
          setLoading(null);
          fundingInProgress.current = false;
        }
        return;
      }

      const isInsufficientSol =
        msg.includes("Insufficient SOL") ||
        msg.includes("no record of a prior credit") ||
        msg.includes("Attempt to debit");
      const isInsufficientUsdc =
        msg.includes("Insufficient USDC") ||
        msg.includes("No USDC") ||
        msg.includes("insufficient funds") ||
        msg.includes("0x1");
      const isRejected = msg.toLowerCase().includes("rejected") || msg.includes("4001");

      console.error("[EscrowActions] tx failed:", msg);

      if (isInsufficientSol)  setError("INSUFFICIENT_SOL");
      else if (isInsufficientUsdc) setError("INSUFFICIENT_USDC");
      else if (isRejected)    setError("REJECTED");
      else setError(msg.slice(0, 140) || "Transaction failed. Please try again.");
      setLoading(null);
      fundingInProgress.current = false;
      return;
    }

    // ── Phase 2: sync DB (retry up to 3×) ──────────────────────────────────
    setLoading("fund:saving");
    try {
      await withRetry(
        () => syncEscrowFunded(orderId, txSig, escrowPDA.toBase58()),
        3,
        "syncEscrowFunded",
      );
      console.log("[EscrowActions] DB synced — order is now funded");
      router.refresh();
    } catch (e: any) {
      // Tx is on-chain but DB update failed after 3 retries.
      // Show the tx hash so support can recover manually.
      console.error("[EscrowActions] DB sync failed after retries:", e);
      setError(
        `Payment sent on-chain (tx: ${txSig.slice(0, 12)}…) but status update failed. ` +
        `Copy the tx and contact support — your funds are safe.`,
      );
    } finally {
      setLoading(null);
      fundingInProgress.current = false;
    }
  }

  async function handleReleaseFunds() {
    if (!anchorWallet) return setError("Connect your Solana wallet first");
    if (!sellerWallet) return setError("Seller has no wallet address on file");
    if (!confirm("Release funds to the seller? This cannot be undone.")) return;
    setLoading("release");
    setError("");
    try {
      const sellerPubkey = new PublicKey(sellerWallet);
      let txSig: string;
      try {
        txSig = await releaseFunds(anchorWallet, connection, orderId, sellerPubkey);
      } catch (e: any) {
        setError(friendlyError(e));
        return;
      }
      // Tx confirmed on-chain — sync DB (non-fatal if DB already updated)
      try {
        await syncEscrowReleased(orderId, txSig);
      } catch (dbErr: any) {
        // If DB already shows completed, ignore — on-chain is source of truth
        const msg = dbErr?.message ?? "";
        if (!msg.includes("not delivered") && !msg.includes("completed")) {
          setError("Payment released on-chain but failed to update order status. Contact support with tx: " + txSig);
          return;
        }
      }
      router.refresh();
    } catch (e: any) {
      setError(friendlyError(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <style>{`@keyframes escrow-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

        {/* ─── PENDING ─── */}
        {orderStatus === "pending" && isBuyer && (
          <div style={{ padding: "1rem 1.1rem", borderRadius: 12, background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.18)" }}>
            <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "var(--foreground)", lineHeight: 1.5, fontWeight: 600 }}>
              Fund this order to lock in your payment.
            </p>
            <p style={{ margin: "0 0 1rem", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Your USDC stays in escrow until the freelancer delivers — they can&apos;t touch it until you approve the work.
            </p>

            {/* Balance strip — shown once wallet is connected */}
            {connected && balances !== null && (
              <div style={{
                display: "flex", gap: "1.5rem", flexWrap: "wrap",
                padding: "0.55rem 0.85rem", borderRadius: 8, marginBottom: "0.75rem",
                background: "rgba(var(--foreground-rgb),0.03)", border: "1px solid var(--card-border)",
                fontSize: "0.72rem",
              }}>
                <span style={{ color: balances.sol < MIN_SOL ? "#ef4444" : "var(--text-muted)" }}>
                  SOL&nbsp;<strong style={{ color: balances.sol < MIN_SOL ? "#ef4444" : "var(--foreground)" }}>{balances.sol.toFixed(4)}</strong>
                  {balances.sol < MIN_SOL && <span style={{ marginLeft: 4, color: "#ef4444" }}>⚠ need ≥{MIN_SOL}</span>}
                </span>
                <span style={{ color: balances.usdc < orderAmount ? "#ef4444" : "var(--text-muted)" }}>
                  USDC&nbsp;<strong style={{ color: balances.usdc < orderAmount ? "#ef4444" : "var(--foreground)" }}>{balances.usdc.toFixed(2)}</strong>
                  {balances.usdc < orderAmount && <span style={{ marginLeft: 4, color: "#ef4444" }}>⚠ need {orderAmount}</span>}
                </span>
                <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                  Est. fee&nbsp;<strong style={{ color: "var(--foreground)" }}>~{MIN_SOL} SOL</strong>
                </span>
              </div>
            )}

            {/* Primary CTA: Fund escrow */}
            {sellerWallet ? (
              connected ? (
                (() => {
                  const insufficientSol  = balances !== null && balances.sol  < MIN_SOL;
                  const insufficientUsdc = balances !== null && balances.usdc < orderAmount;
                  const blocked = insufficientSol || insufficientUsdc;
                  return (
                <>
                  <button
                    onClick={handleFundEscrow}
                    disabled={!!loading || blocked}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      fontSize: "0.92rem", fontWeight: 700,
                      padding: "0.85rem 1.4rem", borderRadius: 10,
                      background: blocked ? "rgba(20,184,166,0.35)" : "#14B8A6", color: "#fff",
                      border: "none", cursor: (loading || blocked) ? "not-allowed" : "pointer",
                      opacity: (loading || blocked) ? 0.65 : 1,
                      transition: "background 0.15s",
                      boxShadow: blocked ? "none" : "0 2px 8px rgba(20,184,166,0.25)",
                    }}
                  >
                    {loading?.startsWith("fund") && <Spinner />}
                    {loading === "fund:sending" ? "Waiting for wallet approval…"
                      : loading === "fund:saving" ? "Saving payment…"
                      : blocked ? `Insufficient balance`
                      : `Fund escrow — $${orderAmount} USDC`}
                  </button>
                  <p style={{ margin: "0.55rem 0 0", fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4 }}>
                    🔒 Secure payment — released only after delivery
                  </p>
                </>
                  );
                })()
              ) : (
                <WalletPicker wallets={wallets} connecting={connecting} showPicker={showWalletPicker} setShowPicker={setShowWalletPicker} onSelect={connectWallet} />
              )
            ) : (
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.5, padding: "0.6rem 0.8rem", borderRadius: 8, background: "rgba(148,163,184,0.06)", border: "1px solid var(--card-border)" }}>
                The freelancer hasn&apos;t connected a wallet yet — escrow funding will be available once they do.
              </p>
            )}

            {/* Error message — inline, action-oriented */}
            {error && ["INSUFFICIENT_SOL","INSUFFICIENT_USDC","REJECTED"].includes(error) && (
              <div style={{
                marginTop: "0.85rem", padding: "0.75rem 0.9rem", borderRadius: 8,
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)",
                fontSize: "0.74rem", color: "var(--foreground)", lineHeight: 1.5,
              }}>
                {error === "INSUFFICIENT_SOL" && (
                  <><strong>⚠️ Not enough SOL.</strong><br />You need ~0.005 SOL for transaction fees. Add SOL to your wallet and try again.</>
                )}
                {error === "INSUFFICIENT_USDC" && (
                  <><strong>⚠️ Not enough USDC.</strong><br />You need ${orderAmount} USDC to fund this order. Top up your wallet and try again.</>
                )}
                {error === "REJECTED" && (
                  <><strong>Transaction cancelled.</strong><br />You rejected the request in your wallet. Click Fund escrow to try again.</>
                )}
              </div>
            )}

            {/* Cancel before funding */}
            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(20,184,166,0.12)", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => handleDbAction("cancelled")}
                disabled={!!loading}
                style={{
                  padding: "0.5rem 1.1rem", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
                  background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444", cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading === "cancelled" ? "Cancelling…" : "Cancel Order"}
              </button>
            </div>
          </div>
        )}

        {orderStatus === "pending" && isSeller && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              New order received. Waiting for the buyer to lock funds in escrow — once funded you can accept and start working.
            </p>
            <button
              onClick={() => handleDbAction("cancelled")}
              disabled={!!loading}
              style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--card-border)", fontWeight: 500 }}
            >
              {loading === "cancelled" ? "Declining…" : "Decline Order"}
            </button>
          </div>
        )}

        {/* ─── FUNDED ─── */}
        {orderStatus === "funded" && isSeller && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Payment is locked in escrow. Accept to start working.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", padding: "0.55rem 0.75rem", borderRadius: 8, background: "rgba(20,184,166,0.07)", border: "1px solid rgba(20,184,166,0.15)", fontSize: "0.7rem", fontFamily: "Inter, sans-serif" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Order total </span>
                <span style={{ fontWeight: 700, color: "var(--foreground)" }}>${orderAmount} USDC</span>
              </div>
              <div style={{ color: "var(--card-border)" }}>·</div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>Platform fee (10%) </span>
                <span style={{ fontWeight: 700, color: "#ef4444" }}>−${feeAmount} USDC</span>
              </div>
              <div style={{ color: "var(--card-border)" }}>·</div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>You receive </span>
                <span style={{ fontWeight: 700, color: "#2DD4BF" }}>${sellerAmount} USDC</span>
              </div>
            </div>
            <button
              onClick={() => handleDbAction("accepted")}
              disabled={!!loading}
              className="btn-primary"
              style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {loading === "accepted" && <Spinner />}
              {loading === "accepted" ? "Accepting…" : "Accept Order"}
            </button>
            {txHash && (
              <a
                href={`https://explorer.solana.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.65rem", color: "#2DD4BF", marginTop: "0.55rem", display: "inline-block" }}
              >
                View escrow tx ↗
              </a>
            )}
          </div>
        )}

        {orderStatus === "funded" && isBuyer && (
          <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", padding: "0.6rem 0.85rem", borderRadius: 8, background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.15)", lineHeight: 1.5 }}>
            Escrow funded. Waiting for the seller to accept and start working.
            {txHash && (
              <a
                href={`https://explorer.solana.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2DD4BF", marginLeft: 8 }}
              >
                View tx ↗
              </a>
            )}
          </div>
        )}

        {/* ─── ACCEPTED ─── */}
        {orderStatus === "accepted" && (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            {isSeller && (
              needsWallet && !connected ? (
                <div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.73rem", color: "var(--text-muted)" }}>
                    Connect your wallet to mark the order as delivered on-chain.
                  </p>
                  <WalletPicker wallets={wallets} connecting={connecting} showPicker={showWalletPicker} setShowPicker={setShowWalletPicker} onSelect={connectWallet} />
                </div>
              ) : (
              <button
                onClick={async () => {
                  // Call mark_delivered on-chain (stamps delivered_at, starts AFK clock),
                  // then update DB status.
                  if (!anchorWallet) { setError("Connect your Solana wallet first"); return; }
                  if (!buyerWallet)  { setError("Buyer wallet not found"); return; }
                  setLoading("delivered");
                  setError("");
                  try {
                    const buyerPubkey = new PublicKey(buyerWallet);
                    await markDelivered(anchorWallet, connection, orderId, buyerPubkey);
                    await updateOrderStatus(orderId, "delivered");
                    router.refresh();
                  } catch (e: any) {
                    const msg: string = e?.message ?? String(e);

                    // Tx already landed on-chain (first attempt succeeded despite simulation error) —
                    // just sync the DB.
                    if (msg.includes("already been processed")) {
                      try { await updateOrderStatus(orderId, "delivered"); router.refresh(); } catch {}
                      return;
                    }

                    setError(friendlyError(e));
                  } finally {
                    setLoading(null);
                  }
                }}
                disabled={!!loading}
                className="btn-primary"
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {loading === "delivered" && <Spinner />}
                {loading === "delivered" ? "Marking…" : "Mark as Delivered"}
              </button>
              )
            )}
            {isBuyer && (
              <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", flex: 1 }}>
                Work in progress — waiting for delivery.
              </div>
            )}
            <DisputeFormInline />
          </div>
        )}

        {/* ─── DELIVERED ─── */}
        {orderStatus === "delivered" && isBuyer && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The freelancer has submitted their work. Review the deliverable, then release payment to complete the order.
            </p>
            {!connected ? (
              <div style={{ marginBottom: "0.5rem" }}>
                <p style={{ margin: "0 0 0.6rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>Connect your wallet to release payment.</p>
                <WalletPicker wallets={wallets} connecting={connecting} showPicker={showWalletPicker} setShowPicker={setShowWalletPicker} onSelect={connectWallet} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleReleaseFunds}
                  disabled={!!loading || revisionLoading}
                  style={{ fontSize: "0.82rem", padding: "0.65rem 1.5rem", cursor: "pointer", borderRadius: 10, background: "#22c55e", color: "#fff", border: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(34,197,94,0.28)" }}
                >
                  {loading === "release" && <Spinner />}
                  {loading === "release" ? "Releasing…" : "Release Payment — Mark as Completed"}
                </button>
                <DisputeFormInline />
              </div>
            )}
            {/* Request Revision */}
            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(34,197,94,0.15)" }}>
              {!showRevisionForm ? (
                <button
                  onClick={() => setShowRevisionForm(true)}
                  disabled={!!loading || revisionLoading}
                  style={{ fontSize: "0.75rem", padding: "0.5rem 1.1rem", cursor: "pointer", borderRadius: 8, background: "rgba(139,92,246,0.08)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)", fontWeight: 600 }}
                >
                  Request Revision
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a78bfa" }}>Request Revision</span>
                    <button onClick={() => { setShowRevisionForm(false); setRevisionErr(""); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem" }}>×</button>
                  </div>
                  <textarea
                    value={revisionMsg}
                    onChange={(e) => setRevisionMsg(e.target.value)}
                    placeholder="Describe what needs to be changed…"
                    rows={3}
                    style={{ resize: "vertical", padding: "0.55rem 0.75rem", borderRadius: 7, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit" }}
                  />
                  {revisionErr && <div style={{ fontSize: "0.72rem", color: "#ef4444" }}>{revisionErr}</div>}
                  <button
                    onClick={async () => {
                      if (!revisionMsg.trim()) return;
                      setRevisionLoading(true); setRevisionErr("");
                      try {
                        await requestRevision(orderId, revisionMsg.trim());
                        router.refresh();
                      } catch (e: any) {
                        setRevisionErr(e.message ?? "Failed");
                        setRevisionLoading(false);
                      }
                    }}
                    disabled={revisionLoading || !revisionMsg.trim()}
                    style={{ alignSelf: "flex-end", padding: "0.5rem 1.1rem", borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.75rem", cursor: revisionLoading || !revisionMsg.trim() ? "not-allowed" : "pointer", opacity: revisionLoading || !revisionMsg.trim() ? 0.6 : 1 }}
                  >
                    {revisionLoading ? "Sending…" : "Send Revision Request"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {orderStatus === "delivered" && isSeller && (
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginBottom: "0.45rem" }}>
                Delivery submitted — waiting for the buyer to review and release payment.
              </div>
              <div style={{ display: "inline-flex", gap: "0.75rem", padding: "0.45rem 0.75rem", borderRadius: 8, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", fontSize: "0.68rem", fontFamily: "Inter, sans-serif" }}>
                <span style={{ color: "var(--text-muted)" }}>Platform fee <strong style={{ color: "#ef4444" }}>−${feeAmount} USDC</strong></span>
                <span style={{ color: "var(--card-border)" }}>·</span>
                <span style={{ color: "var(--text-muted)" }}>Your payout <strong style={{ color: "#2DD4BF" }}>${sellerAmount} USDC</strong></span>
              </div>
            </div>
            <DisputeFormInline />
          </div>
        )}

        {/* ─── REVISION REQUESTED ─── */}
        {orderStatus === "revision_requested" && isBuyer && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Revision requested — waiting for the seller to resubmit.
            <div style={{ marginTop: "0.5rem" }}>
              <DisputeFormInline />
            </div>
          </div>
        )}

        {orderStatus === "revision_requested" && isSeller && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The buyer has requested changes. Review their message, then resubmit your updated work.
            </p>
            <textarea
              value={resubmitMsg}
              onChange={(e) => setResubmitMsg(e.target.value)}
              placeholder="Describe what you changed (optional)…"
              rows={3}
              style={{ width: "100%", resize: "vertical", padding: "0.55rem 0.75rem", borderRadius: 7, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            {revisionErr && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "0.4rem" }}>{revisionErr}</div>}
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
              <button
                onClick={async () => {
                  setRevisionLoading(true); setRevisionErr("");
                  try {
                    await resubmitWork(orderId, resubmitMsg.trim() || undefined);
                    router.refresh();
                  } catch (e: any) {
                    setRevisionErr(e.message ?? "Failed");
                    setRevisionLoading(false);
                  }
                }}
                disabled={revisionLoading}
                className="btn-primary"
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: revisionLoading ? "wait" : "pointer", display: "flex", alignItems: "center" }}
              >
                {revisionLoading && <Spinner />}
                {revisionLoading ? "Resubmitting…" : "Resubmit Work"}
              </button>
              <DisputeFormInline />
            </div>
          </div>
        )}

        {/* ─── DISPUTED ─── */}
        {orderStatus === "disputed" && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Dispute opened. The platform admin will review and resolve this order.
          </div>
        )}

        {/* ─── COMPLETED ─── */}
        {orderStatus === "completed" && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: txHash ? "0.5rem" : 0 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#22c55e", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22c55e" }}>Order completed</span>
            </div>
            {!txHash && (
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Payment was processed outside escrow.
              </p>
            )}
            {txHash && (
              <a
                href={`https://explorer.solana.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.65rem", color: "#22c55e", display: "inline-block" }}
              >
                View payment tx ↗
              </a>
            )}
          </div>
        )}

        {/* ─── CANCELLED ─── */}
        {orderStatus === "cancelled" && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            This order was cancelled. No funds were moved.
          </div>
        )}

        {/* Generic error — shown for unexpected failures */}
        {error && !["INSUFFICIENT_SOL","INSUFFICIENT_USDC","REJECTED"].includes(error) && (
          <div style={{
            padding: "0.75rem 0.9rem", borderRadius: 8, marginTop: "0.5rem",
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            fontSize: "0.74rem", color: "var(--foreground)", lineHeight: 1.5,
          }}>
            <strong>Something went wrong.</strong><br />{error}
          </div>
        )}
      </div>
    </>
  );
}
