"use client";

import { useState } from "react";
import { linkWallet, unlinkWallet } from "@/actions/wallet";

export default function LinkWallet({ currentWallet }: { currentWallet?: string | null }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (currentWallet) {
    return (
      <div className="dash-stat" style={{ gridColumn: "span 2" }}>
        <div className="dash-stat-label">Linked Wallet</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ fontSize: "0.9rem", color: "#2DD4BF", fontWeight: 600 }}>
            {currentWallet.slice(0, 6)}...{currentWallet.slice(-4)}
          </div>
          <span style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.3)" }}>✓ Linked</span>
          <button
            onClick={async () => { await unlinkWallet(); window.location.reload(); }}
            className="btn-secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", height: "auto" }}
          >
            REMOVE
          </button>
        </div>
      </div>
    );
  }

  async function handleLink() {
    const trimmed = address.trim();
    if (!trimmed) { setError("Enter a wallet address."); return; }
    setLoading(true);
    setError("");
    setSuccess(false);
    const res = await linkWallet({ publicKey: trimmed, message: "", signature: "" });
    if (res?.ok) {
      setSuccess(true);
      setAddress("");
      setTimeout(() => window.location.reload(), 800);
    } else {
      setError("Failed to link wallet. Check the address and try again.");
    }
    setLoading(false);
  }

  return (
    <div className="dash-stat" style={{ gridColumn: "span 2" }}>
      <div className="dash-stat-label">Link Wallet</div>
      <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Paste your Solana wallet address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.82rem", background: "transparent", boxSizing: "border-box" }}
        />
        <button
          onClick={handleLink}
          disabled={loading}
          className="btn-primary"
          style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto" }}
        >
          {loading ? "SAVING..." : "LINK WALLET"}
        </button>
        {error && <div style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</div>}
        {success && <div style={{ fontSize: "0.75rem", color: "#2DD4BF" }}>Wallet linked!</div>}
      </div>
    </div>
  );
}
