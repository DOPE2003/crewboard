"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { fundEscrow, releaseFunds, markDelivered, deriveEscrowPDA, calcFee } from "@/lib/escrow";
import { syncEscrowFunded, syncEscrowReleased, updateOrderStatus } from "@/actions/orders";

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
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fundingInProgress = useRef(false);
  const recoveryChecked = useRef(false);

  const { sellerAmount, feeAmount } = calcFee(orderAmount);

  const anchorWallet = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return { publicKey, signTransaction, signAllTransactions };
  }, [publicKey, signTransaction, signAllTransactions]);

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

            {/* Primary CTA: Fund escrow */}
            {sellerWallet ? (
              connected ? (
                <>
                  <button
                    onClick={handleFundEscrow}
                    disabled={!!loading}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      fontSize: "0.92rem", fontWeight: 700,
                      padding: "0.85rem 1.4rem", borderRadius: 10,
                      background: "#14B8A6", color: "#fff",
                      border: "none", cursor: loading ? "wait" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      transition: "background 0.15s",
                      boxShadow: "0 2px 8px rgba(20,184,166,0.25)",
                    }}
                  >
                    {loading?.startsWith("fund") && <Spinner />}
                    {loading === "fund:sending" ? "Waiting for wallet approval…"
                      : loading === "fund:saving" ? "Saving payment…"
                      : `Fund escrow — $${orderAmount} USDC`}
                  </button>
                  <p style={{ margin: "0.55rem 0 0", fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4 }}>
                    🔒 Secure payment — released only after delivery
                  </p>
                </>
              ) : (
                <WalletMultiButton style={{ width: "100%", height: 44, borderRadius: 10, fontSize: "0.85rem" }} />
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

            {/* Secondary: Cancel — small, subtle, at bottom */}
            <div style={{ marginTop: "0.9rem", textAlign: "center" }}>
              <button
                onClick={() => handleDbAction("cancelled")}
                disabled={!!loading}
                style={{
                  background: "none", border: "none", padding: "4px 8px",
                  fontSize: "0.7rem", color: "var(--text-muted)",
                  cursor: loading ? "wait" : "pointer", textDecoration: "underline",
                }}
              >
                {loading === "cancelled" ? "Cancelling…" : "Cancel order"}
              </button>
            </div>
          </div>
        )}

        {orderStatus === "pending" && isSeller && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              New order received. Accept to confirm you&apos;ll take the work — the buyer will be notified immediately.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleDbAction("accepted")}
                disabled={!!loading}
                className="btn-primary"
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {loading === "accepted" && <Spinner />}
                {loading === "accepted" ? "Accepting…" : "Accept Order"}
              </button>
              <button
                onClick={() => handleDbAction("cancelled")}
                disabled={!!loading}
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--card-border)", fontWeight: 500 }}
              >
                {loading === "cancelled" ? "Declining…" : "Decline"}
              </button>
            </div>
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
                  <WalletMultiButton style={{ fontSize: "0.75rem", height: 36, borderRadius: 99 }} />
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

                    // If the on-chain call has a placeholder discriminator (not yet rebuilt),
                    // fall through to DB-only update so the UI doesn't get stuck.
                    const isDiscriminatorPlaceholder =
                      msg.includes("custom program error: 0x") ||
                      msg.includes("Invalid instruction") ||
                      msg.includes("unknown instruction");
                    if (isDiscriminatorPlaceholder) {
                      console.warn("[EscrowActions] mark_delivered discriminator not set — falling back to DB-only.");
                      try { await updateOrderStatus(orderId, "delivered"); router.refresh(); } catch {}
                    } else {
                      setError(friendlyError(e));
                    }
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
            <button
              onClick={() => handleDbAction("disputed")}
              disabled={!!loading}
              style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 600 }}
            >
              {loading === "disputed" ? "Opening…" : "Open Dispute"}
            </button>
          </div>
        )}

        {/* ─── DELIVERED ─── */}
        {orderStatus === "delivered" && isBuyer && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              The freelancer has submitted their work. Review the deliverable, then release payment to complete the order.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleDbAction("completed")}
                disabled={!!loading}
                style={{ fontSize: "0.82rem", padding: "0.65rem 1.5rem", cursor: "pointer", borderRadius: 10, background: "#22c55e", color: "#fff", border: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(34,197,94,0.28)" }}
              >
                {loading === "completed" && <Spinner />}
                {loading === "completed" ? "Releasing…" : "Release Payment — Mark as Completed"}
              </button>
              <button
                onClick={() => handleDbAction("disputed")}
                disabled={!!loading}
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.25rem", cursor: "pointer", borderRadius: 10, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", fontWeight: 500 }}
              >
                {loading === "disputed" ? "Opening…" : "Raise a dispute"}
              </button>
            </div>
            {connected && sellerWallet && (
              <button
                onClick={handleReleaseFunds}
                disabled={!!loading}
                style={{ marginTop: 10, fontSize: "0.7rem", background: "none", border: "none", color: "#14B8A6", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                {loading === "release" ? "Releasing on-chain…" : "Release via on-chain escrow instead ↗"}
              </button>
            )}
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
            <button
              onClick={() => handleDbAction("disputed")}
              disabled={!!loading}
              style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 600 }}
            >
              {loading === "disputed" ? "Opening…" : "Open Dispute"}
            </button>
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
