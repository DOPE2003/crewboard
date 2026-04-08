"use client";

import { useState, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { resolveDispute } from "@/lib/escrow";
import { syncDisputeResolved } from "@/actions/admin";

interface Props {
  orderId: string;
  buyerWallet: string;
  sellerWallet: string;
  amount: number;
  gigTitle: string;
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 12, height: 12,
      border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
      borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: 6,
    }} />
  );
}

export default function DisputeResolveActions({ orderId, buyerWallet, sellerWallet, amount, gigTitle }: Props) {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const [loading, setLoading] = useState<"buyer" | "seller" | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const anchorWallet = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return { publicKey, signTransaction, signAllTransactions };
  }, [publicKey, signTransaction, signAllTransactions]);

  async function handleResolve(routeToBuyer: boolean) {
    if (!anchorWallet) return setError("Connect your admin wallet first");
    const label = routeToBuyer ? "refund the buyer" : "release funds to the seller";
    if (!confirm(`Are you sure you want to ${label}? This cannot be undone.`)) return;

    setLoading(routeToBuyer ? "buyer" : "seller");
    setError("");
    try {
      const buyerPubkey  = new PublicKey(buyerWallet);
      const sellerPubkey = new PublicKey(sellerWallet);
      const txHash = await resolveDispute(anchorWallet, connection, orderId, buyerPubkey, sellerPubkey, routeToBuyer);
      await syncDisputeResolved(orderId, txHash, routeToBuyer);
      setConfirmed(true);
      setTimeout(() => router.refresh(), 800);
    } catch (e: any) {
      setError(e?.message?.slice(0, 160) ?? "Transaction failed");
    } finally {
      setLoading(null);
    }
  }

  if (confirmed) {
    return (
      <div style={{ padding: "1.5rem", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", textAlign: "center" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✓</div>
        <div style={{ fontWeight: 700, color: "#22c55e" }}>Dispute resolved successfully</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>Both parties have been notified.</div>
      </div>
    );
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {!connected ? (
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Connect your admin wallet to sign the on-chain resolution transaction.
          </p>
          <WalletMultiButton style={{ fontSize: "0.75rem", height: 38, borderRadius: 99 }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            This will call <code style={{ background: "var(--card-border)", padding: "1px 5px", borderRadius: 4 }}>resolve_dispute</code> on-chain.
            Funds (<strong>${amount} USDC</strong>) will be moved from escrow to the chosen party.
            The action is <strong>irreversible</strong>.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <button
              onClick={() => handleResolve(true)}
              disabled={!!loading}
              style={{
                padding: "0.85rem 1rem", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem",
                cursor: loading ? "not-allowed" : "pointer", border: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: loading && loading !== "buyer" ? 0.5 : 1,
              }}
            >
              {loading === "buyer" && <Spinner />}
              Refund Buyer
              <span style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.8 }}>(${amount} → buyer)</span>
            </button>

            <button
              onClick={() => handleResolve(false)}
              disabled={!!loading}
              style={{
                padding: "0.85rem 1rem", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem",
                cursor: loading ? "not-allowed" : "pointer", border: "none",
                background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: loading && loading !== "seller" ? 0.5 : 1,
              }}
            >
              {loading === "seller" && <Spinner />}
              Release to Seller
              <span style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.8 }}>(${amount} → seller)</span>
            </button>
          </div>

          {connected && (
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Signing as: <code style={{ background: "var(--card-border)", padding: "1px 5px", borderRadius: 4 }}>{publicKey?.toBase58().slice(0, 8)}…</code>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.78rem", color: "#ef4444" }}>
          {error}
        </div>
      )}
    </>
  );
}
