"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

function shortAddr(addr: string) {
  return addr.slice(0, 4) + "..." + addr.slice(-4);
}

function detectMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(
    navigator.userAgent
  );
}

function phantomDeepLink(url: string): string {
  return (
    "https://phantom.app/ul/browse/" +
    encodeURIComponent(url) +
    "?ref=" +
    encodeURIComponent(window.location.origin)
  );
}

export default function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return <WalletButtonInner />;
}

function WalletButtonInner() {
  const { connected, publicKey, disconnect, wallets } = useWallet();
  const { setVisible } = useWalletModal();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [isMobile] = useState(() => detectMobile());
  // Use wallet adapter's wallets array — works with both Chrome injection
  // AND Firefox Wallet Standard registration (async-safe)
  const hasWallet = wallets.some(w => w.readyState === "Installed");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mobile, no wallet detected → deep-link to Phantom browser
  if (isMobile && !hasWallet && !connected) {
    return (
      <a
        href={phantomDeepLink(window.location.href)}
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "0.35rem 0.75rem", borderRadius: "999px",
          fontFamily: "Inter, sans-serif", fontSize: "0.68rem", fontWeight: 700,
          border: "1.5px solid #ab9ff2",
          background: "rgba(171,159,242,0.1)",
          color: "#ab9ff2",
          cursor: "pointer", transition: "all 0.15s",
          letterSpacing: "0.03em", textDecoration: "none",
        }}
      >
        <PhantomIcon size={11} />
        Open in Phantom
      </a>
    );
  }

  const handleConnect = () => {
    // Open the wallet adapter modal — handles all browsers (Chrome, Firefox, Brave, Edge)
    setVisible(true);
  };

  const handleDisconnect = async () => {
    setOpen(false);
    try { await disconnect(); } catch { /* ignore */ }
    try { localStorage.removeItem("walletName"); } catch { /* ignore */ }
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

function PhantomIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="currentColor" aria-hidden="true">
      <path d="M64 4C31.3 4 4 31.3 4 64s27.3 60 60 60 60-27.3 60-60S96.7 4 64 4zm28.5 68.2c-3.8 10.6-13.8 17.5-25 17.5-7 0-12.9-2.7-17.2-7.7l-3.8 7.7H34.4l7.8-15.8-5.3-10.5h10.5l1.5 3.1c.4-3.2 1.4-6.1 3.1-8.7 2.5-4.1 6.3-6.9 10.8-8.4v-.1c7.7-2.4 15.9-.1 21.1 5.8l4.1-8.2H99l-11.7 23.5 5.2 2.8z"/>
    </svg>
  );
}
