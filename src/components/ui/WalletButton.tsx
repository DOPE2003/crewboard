"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";

function shortAddr(addr: string) {
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

export default function WalletButton() {
  const { connected, publicKey, connect, disconnect, wallets, select } = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConnect = async (walletName: string) => {
    const w = wallets.find((w) => w.adapter.name === walletName);
    if (!w) return;
    select(w.adapter.name);
    setOpen(false);
    try { await connect(); } catch {}
  };

  const handleDisconnect = async () => {
    await disconnect();
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.35rem 0.75rem", borderRadius: "999px",
          fontFamily: "Space Mono, monospace", fontSize: "0.68rem", fontWeight: 700,
          border: connected ? "1.5px solid #14b8a6" : "1.5px solid rgba(0,0,0,0.15)",
          background: connected ? "rgba(20,184,166,0.07)" : "transparent",
          color: connected ? "#14b8a6" : "rgba(0,0,0,0.55)",
          cursor: "pointer", transition: "all 0.15s",
          letterSpacing: "0.03em",
        }}
      >
        <span style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: connected ? "#14b8a6" : "rgba(0,0,0,0.2)",
        }} />
        {connected && publicKey ? shortAddr(publicKey.toBase58()) : "Connect Wallet"}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#fff", border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: "12px", boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
          minWidth: "180px", zIndex: 9999, overflow: "hidden", padding: "0.4rem",
        }}>
          {connected ? (
            <>
              <div style={{
                padding: "0.4rem 0.75rem 0.5rem",
                fontFamily: "Space Mono, monospace", fontSize: "0.6rem",
                color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {publicKey && shortAddr(publicKey.toBase58())}
              </div>
              <button
                onClick={handleDisconnect}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.75rem", borderRadius: "8px",
                  fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", fontWeight: 600,
                  color: "#dc2626", background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div style={{
                padding: "0.4rem 0.75rem 0.5rem",
                fontFamily: "Space Mono, monospace", fontSize: "0.6rem",
                color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Choose Wallet
              </div>
              {["Phantom", "Solflare"].map((name) => (
                <button
                  key={name}
                  onClick={() => handleConnect(name)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.5rem 0.75rem", borderRadius: "8px",
                    fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", fontWeight: 600,
                    color: "#0f172a", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: name === "Phantom" ? "#ab9ff2" : "#ff6b00",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800, color: "#fff",
                  }}>
                    {name[0]}
                  </span>
                  {name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
