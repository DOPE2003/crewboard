"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { linkWallet, unlinkWallet } from "@/actions/wallet";
import bs58 from "bs58";

// Sub-component that actually uses the wallet context
function LinkWalletInner({ currentWallet }: { currentWallet?: string | null }) {
  const { publicKey, signMessage, connected, disconnect, wallet, wallets, select, connect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  const handleDisconnect = async () => {
    try {
      await unlinkWallet();
    } catch {
      // best-effort — still disconnect adapter
    }
    disconnect();
  };

  // After select(), wallet state updates — then call connect()
  useEffect(() => {
    if (connectingTo && wallet?.adapter.name === connectingTo && !connected) {
      connect().catch(() => setConnectingTo(null));
    }
    if (connected) setConnectingTo(null);
  }, [wallet, connectingTo, connected, connect]);

  const handleLink = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected or does not support signing.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const messageStr = `Sign this message to link your wallet to Crewboard: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(messageStr);
      
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      const res = await linkWallet({
        publicKey: publicKey.toBase58(),
        message: messageStr,
        signature,
      });

      if (res.ok) {
        setSuccess(true);
      }
    } catch (e: any) {
      console.error("Link Error:", e);
      setError(e.message ?? "Failed to link wallet. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (currentWallet) {
    return (
      <div className="dash-stat" style={{ gridColumn: "span 2" }}>
        <div className="dash-stat-label">Verified Wallet</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
          <div className="dash-stat-value" style={{ fontSize: "0.9rem", color: "#2DD4BF" }}>
            {currentWallet.slice(0, 6)}...{currentWallet.slice(-4)}
          </div>
          <span style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.3)" }}>✓ Linked</span>
          <button
            onClick={handleDisconnect}
            className="btn-secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", height: "auto" }}
          >
            DISCONNECT
          </button>
        </div>
      </div>
    );
  }

  const handleConnect = (walletName: string) => {
    select(walletName as any);
    setConnectingTo(walletName);
  };

  if (!connected) {
    const knownWallets = wallets.filter((w) =>
      ["Phantom", "Solflare"].includes(w.adapter.name)
    );
    return (
      <div className="dash-stat" style={{ gridColumn: "span 2" }}>
        <div className="dash-stat-label">Payments & Infrastructure</div>
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {knownWallets.length > 0 ? knownWallets.map((w) => (
            <button
              key={w.adapter.name}
              onClick={() => handleConnect(w.adapter.name)}
              disabled={connectingTo === w.adapter.name}
              className="btn-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.85rem", fontSize: "0.8rem", height: "auto", justifyContent: "flex-start" }}
            >
              {w.adapter.icon ? (
                <img src={w.adapter.icon} alt={w.adapter.name} style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }} />
              ) : (
                <span style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>
                  {w.adapter.name[0]}
                </span>
              )}
              {connectingTo === w.adapter.name ? "CONNECTING..." : `Connect ${w.adapter.name}`}
            </button>
          )) : (
            <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>
              No wallet extension detected. Install Phantom or Solflare.
            </div>
          )}
        </div>
        <div style={{ fontSize: "0.65rem", color: "rgba(0,0,0,0.3)", marginTop: "0.5rem" }}>
          Solana Devnet · USDC Support
        </div>
      </div>
    );
  }

  return (
    <div className="dash-stat" style={{ gridColumn: "span 2" }}>
      <div className="dash-stat-label">Payments & Infrastructure</div>
      <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.82rem", color: "rgba(0,0,0,0.6)" }}>
          Connected: <span style={{ color: "#000", fontWeight: 600 }}>{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleLink}
            disabled={loading}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto", flex: 1 }}
          >
            {loading ? "VERIFYING..." : "VERIFY & LINK WALLET"}
          </button>
          
          <button
            onClick={handleDisconnect}
            className="btn-secondary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", height: "auto", minWidth: "100px" }}
          >
            DISCONNECT
          </button>
        </div>

        {error && <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ fontSize: "0.75rem", color: "#2DD4BF", fontWeight: 600 }}>Wallet linked successfully!</div>}
      </div>
    </div>
  );
}

// Main component that handles the client-only mounting
export default function LinkWallet({ currentWallet }: { currentWallet?: string | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="dash-stat" style={{ gridColumn: "span 2" }}>
        <div className="dash-stat-label">Payments & Infrastructure</div>
        <div style={{ height: "40px", marginTop: "0.5rem" }} />
      </div>
    );
  }

  return <LinkWalletInner currentWallet={currentWallet} />;
}
