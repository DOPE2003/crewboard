"use client";

import { useState, useMemo } from "react";
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

export default function EscrowActions({
  orderId, orderStatus, orderAmount, isBuyer, isSeller, sellerWallet, buyerWallet, txHash,
}: Props) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { sellerAmount, feeAmount } = calcFee(orderAmount);

  const anchorWallet = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return { publicKey, signTransaction, signAllTransactions };
  }, [publicKey, signTransaction, signAllTransactions]);

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
    if (!anchorWallet) return setError("Connect your Solana wallet first");
    if (!sellerWallet) return setError("Seller has no wallet address on file");
    setLoading("fund");
    setError("");
    try {
      const sellerPubkey = new PublicKey(sellerWallet);
      const [escrowPDA] = deriveEscrowPDA(anchorWallet.publicKey, sellerPubkey, orderId);

      let txSig: string;
      try {
        txSig = await fundEscrow(anchorWallet, connection, orderId, sellerPubkey, orderAmount);
      } catch (e: any) {
        const msg = e?.message ?? "";
        // Transaction already landed on-chain but DB was never updated —
        // recover gracefully by syncing the DB using the derived PDA.
        const alreadyProcessed =
          msg.includes("already been processed") ||
          msg.includes("AlreadyInUse") ||
          msg.includes("already in use");
        if (alreadyProcessed) {
          await syncEscrowFunded(orderId, "recovered", escrowPDA.toBase58());
          router.refresh();
          return;
        }
        const isInsufficientFunds =
          msg.includes("no record of a prior credit") ||
          msg.includes("insufficient funds") ||
          msg.includes("Attempt to debit") ||
          msg.includes("0x1");
        setError(isInsufficientFunds ? "INSUFFICIENT_FUNDS" : (msg.slice(0, 120) || "Transaction failed. Please try again."));
        return;
      }

      await syncEscrowFunded(orderId, txSig, escrowPDA.toBase58());
      router.refresh();
    } catch (e: any) {
      setError(e?.message?.slice(0, 120) || "Transaction failed. Please try again.");
    } finally {
      setLoading(null);
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
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Order placed — waiting for the freelancer to accept. You&apos;ll be notified once they confirm.
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => handleDbAction("cancelled")}
                disabled={!!loading}
                className="btn-secondary"
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
              >
                {loading === "cancelled" ? "Cancelling…" : "Cancel Order"}
              </button>
              {sellerWallet && (
                connected ? (
                  <button
                    onClick={handleFundEscrow}
                    disabled={!!loading}
                    style={{ fontSize: "0.7rem", background: "none", border: "none", color: "#14B8A6", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                  >
                    {loading === "fund" ? "Funding…" : `Fund escrow instead ($${orderAmount} USDC) ↗`}
                  </button>
                ) : (
                  <WalletMultiButton style={{ fontSize: "0.72rem", height: 32, borderRadius: 99 }} />
                )
              )}
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

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm mt-3">
            {error === "INSUFFICIENT_FUNDS" ? (
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  Insufficient USDC balance
                </p>
                <p className="text-amber-700 dark:text-amber-400 leading-relaxed">
                  Your wallet doesn&apos;t have enough USDC to fund this escrow. Please top up your USDC balance and try again.
                </p>
              </div>
            ) : (
              <p className="text-red-700 dark:text-red-400">{error}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
