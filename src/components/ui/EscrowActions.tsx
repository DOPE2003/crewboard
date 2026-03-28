"use client";

import { useState, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { fundEscrow, releaseFunds, deriveEscrowPDA } from "@/lib/escrow";
import { syncEscrowFunded, syncEscrowReleased, updateOrderStatus } from "@/actions/orders";

interface Props {
  orderId: string;
  orderStatus: string;
  orderAmount: number;
  isBuyer: boolean;
  isSeller: boolean;
  sellerWallet: string | null;
  buyerWallet: string | null;
  txHash?: string | null;
}

function friendlyError(e: any): string {
  const msg: string = e?.message ?? String(e);
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
  orderId, orderStatus, orderAmount, isBuyer, isSeller, sellerWallet, txHash,
}: Props) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const anchorWallet = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return { publicKey, signTransaction, signAllTransactions };
  }, [publicKey, signTransaction, signAllTransactions]);

  // Whether this status requires an on-chain wallet tx from the buyer
  const needsWallet = isBuyer && (orderStatus === "pending" || orderStatus === "delivered");

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
      const txSig = await fundEscrow(anchorWallet, connection, orderId, sellerPubkey, orderAmount);
      const [escrowPDA] = deriveEscrowPDA(anchorWallet.publicKey, sellerPubkey, orderId);
      await syncEscrowFunded(orderId, txSig, escrowPDA.toBase58());
      router.refresh();
    } catch (e: any) {
      const raw = e?.message ?? "";
      const isInsufficientFunds =
        raw.includes("no record of a prior credit") ||
        raw.includes("insufficient funds") ||
        raw.includes("Attempt to debit") ||
        raw.includes("0x1");
      setError(isInsufficientFunds ? "INSUFFICIENT_FUNDS" : (raw.slice(0, 120) || "Transaction failed. Please try again."));
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
      const txSig = await releaseFunds(anchorWallet, connection, orderId, sellerPubkey);
      await syncEscrowReleased(orderId, txSig);
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
              Fund escrow to activate your order. The seller will start work once payment is locked on-chain.
            </p>
            {needsWallet && !connected ? (
              <WalletMultiButton style={{ fontSize: "0.75rem", height: 36, borderRadius: 99 }} />
            ) : (
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleFundEscrow}
                  disabled={!!loading}
                  className="btn-primary"
                  style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {loading === "fund" && <Spinner />}
                  {loading === "fund" ? "Funding…" : `Fund Escrow ($${orderAmount} USDC)`}
                </button>
                <button
                  onClick={() => handleDbAction("cancelled")}
                  disabled={!!loading}
                  className="btn-secondary"
                  style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
                >
                  {loading === "cancelled" ? "Cancelling…" : "Cancel"}
                </button>
              </div>
            )}
          </div>
        )}

        {orderStatus === "pending" && isSeller && (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", flex: 1 }}>
              Waiting for the buyer to fund escrow before you can accept.
            </div>
            <button
              onClick={() => handleDbAction("cancelled")}
              disabled={!!loading}
              className="btn-secondary"
              style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer" }}
            >
              {loading === "cancelled" ? "Cancelling…" : "Cancel"}
            </button>
          </div>
        )}

        {/* ─── FUNDED ─── */}
        {orderStatus === "funded" && isSeller && (
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Payment is locked in escrow. Accept to start working.
            </p>
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
                href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
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
                href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
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
              <button
                onClick={() => handleDbAction("delivered")}
                disabled={!!loading}
                className="btn-primary"
                style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {loading === "delivered" && <Spinner />}
                {loading === "delivered" ? "Marking…" : "Mark as Delivered"}
              </button>
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
          <div style={{ padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Work delivered! Review the deliverable then release funds from escrow.
            </p>
            {needsWallet && !connected ? (
              <WalletMultiButton style={{ fontSize: "0.75rem", height: 36, borderRadius: 99 }} />
            ) : (
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleReleaseFunds}
                  disabled={!!loading}
                  style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", border: "none", fontWeight: 700, display: "flex", alignItems: "center" }}
                >
                  {loading === "release" && <Spinner />}
                  {loading === "release" ? "Releasing…" : "Release Funds"}
                </button>
                <button
                  onClick={() => handleDbAction("disputed")}
                  disabled={!!loading}
                  style={{ fontSize: "0.78rem", padding: "0.6rem 1.4rem", cursor: "pointer", borderRadius: 99, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 600 }}
                >
                  {loading === "disputed" ? "Opening…" : "Open Dispute"}
                </button>
              </div>
            )}
          </div>
        )}

        {orderStatus === "delivered" && isSeller && (
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.73rem", color: "var(--text-muted)", flex: 1 }}>
              Delivery submitted — waiting for the buyer to review and release payment.
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
                href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
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
                  Your wallet doesn&apos;t have enough devnet USDC to fund this escrow. Get free test USDC at{" "}
                  <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200">
                    faucet.circle.com
                  </a>{" "}
                  and devnet SOL at{" "}
                  <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200">
                    faucet.solana.com
                  </a>.
                </p>
                <p className="text-amber-600 dark:text-amber-500 text-xs">
                  Make sure your wallet is set to <strong>Devnet</strong> network in Phantom or Backpack settings.
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
