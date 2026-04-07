"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

function shortAddr(addr: string) {
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

// Connects Phantom directly via window.phantom.solana within a click handler
// (preserves user-gesture context so the extension popup fires).
// CRITICAL ORDER: await provider.connect() FIRST so Phantom is connected before
// select() initialises the adapter — otherwise adapter.connected is false on init
// and publicKey never propagates.
async function connectPhantomDirect(select: (name: any) => void): Promise<boolean> {
  const provider =
    (window as any).phantom?.solana ??
    ((window as any).solana?.isPhantom ? (window as any).solana : null);

  if (!provider) return false;

  try {
    await provider.connect();   // 1️⃣ popup fires here, user approves → isConnected=true
    select("Phantom");          // 2️⃣ adapter inits, sees isConnected=true, publicKey propagates
    return true;
  } catch (e: any) {
    if (e?.code !== 4001) console.error("Phantom connect error:", e);
    return false;
  }
}

export default function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <WalletButtonInner />;
}

function WalletButtonInner() {
  const { connected, publicKey, select, disconnect } = useWallet();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConnect = async () => {
    const ok = await connectPhantomDirect(select);
    if (!ok) {
      // Phantom not detected — prompt install
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => connected ? setOpen((o) => !o) : handleConnect()}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.35rem 0.75rem", borderRadius: "999px",
          fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 700,
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
        {connected && publicKey ? shortAddr(publicKey.toBase58()) : t("wallet.connect")}
      </button>

      {open && connected && (
        <div className="wallet-dropdown" style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          borderRadius: "12px",
          minWidth: "180px", zIndex: 9999, overflow: "hidden", padding: "0.4rem",
        }}>
          <div style={{
            padding: "0.4rem 0.75rem 0.5rem",
            fontFamily: "Inter, sans-serif", fontSize: "0.6rem",
            color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {publicKey && shortAddr(publicKey.toBase58())}
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 0.75rem", borderRadius: "8px",
              fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 600,
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
            {t("wallet.disconnect")}
          </button>
        </div>
      )}
    </div>
  );
}
