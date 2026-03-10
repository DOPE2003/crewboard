"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { linkWallet } from "@/actions/wallet";

export default function LinkWallet({ currentWallet }: { currentWallet?: string | null }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleLink = async () => {
    if (!address) return;
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const message = `Sign this message to link your wallet to Crewboard: ${address.toLowerCase()}\nTimestamp: ${Date.now()}`;
      
      const signature = await signMessageAsync({ message });

      const res = await linkWallet({
        address: address,
        message,
        signature,
      });

      if (res.ok) {
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to link wallet. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (currentWallet) {
    return (
      <div className="dash-stat" style={{ gridColumn: "span 2" }}>
        <div className="dash-stat-label">Verified Wallet</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="dash-stat-value" style={{ fontSize: "0.9rem", color: "#2DD4BF" }}>
            {currentWallet.slice(0, 6)}...{currentWallet.slice(-4)}
          </div>
          <span style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.3)" }}>✓ Linked</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-stat" style={{ gridColumn: "span 2" }}>
      {!isConnected ? (
        <div style={{ marginTop: "0.5rem" }}>
          <ConnectKitButton />
        </div>
      ) : (
        <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>
            Connected: {address!.slice(0, 6)}...{address!.slice(-4)}
          </div>
          <button
            onClick={handleLink}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto" }}
          >
            {loading ? "VERIFYING..." : "VERIFY & LINK WALLET"}
          </button>
          {error && <div style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</div>}
          {success && <div style={{ fontSize: "0.75rem", color: "#2DD4BF" }}>Wallet linked successfully!</div>}
        </div>
      )}
    </div>
  );
}
