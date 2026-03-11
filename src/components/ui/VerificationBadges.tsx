// Wallet Verified badge — shown when walletAddress is set (signature already verified in linkWallet)
export function WalletVerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99,
      background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
      border: "1px solid rgba(96,165,250,0.4)",
      boxShadow: "0 0 8px rgba(96,165,250,0.2)",
      fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.06em",
      color: "#93c5fd",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      Wallet Verified
    </span>
  );
}

// Human Verified badge — shown when humanVerified is true
export function HumanVerifiedBadge({ level }: { level?: string | null }) {
  const isOrb = level === "orb";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99,
      background: isOrb
        ? "linear-gradient(135deg, #14532d 0%, #166534 100%)"
        : "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
      border: isOrb
        ? "1px solid rgba(74,222,128,0.5)"
        : "1px solid rgba(74,222,128,0.35)",
      boxShadow: isOrb
        ? "0 0 8px rgba(74,222,128,0.25)"
        : "0 0 6px rgba(74,222,128,0.15)",
      fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.06em",
      color: "#86efac",
      flexShrink: 0,
      whiteSpace: "nowrap",
    }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      {isOrb ? "Orb Verified" : "Human Verified"}
    </span>
  );
}
