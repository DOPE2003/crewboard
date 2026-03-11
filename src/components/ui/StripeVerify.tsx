"use client";

import { useState } from "react";

interface Props {
  humanVerified: boolean;
}

export default function StripeVerify({ humanVerified }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startVerification = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/verify/stripe/create-session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start verification");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setLoading(false);
    }
  };

  if (humanVerified) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>Identity Verified</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        onClick={startVerification}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "0.6rem 1.1rem", borderRadius: 10,
          background: loading ? "rgba(22,163,74,0.04)" : "rgba(22,163,74,0.08)",
          border: "1px solid rgba(22,163,74,0.3)",
          color: "#15803d", fontSize: "0.8rem", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          width: "fit-content", opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="4" x2="8" y2="9" />
        </svg>
        {loading ? "Redirecting to Stripe..." : "Verify Identity"}
      </button>

      <div style={{ fontSize: "0.68rem", color: "#94a3b8", lineHeight: 1.65, maxWidth: 320 }}>
        Powered by Stripe Identity. Takes 2 minutes — scan your passport or ID, then take a selfie. Stripe verifies the match. Your documents are never stored on Crewboard.
      </div>

      {error && (
        <div style={{ fontSize: "0.72rem", color: "#ef4444" }}>{error}</div>
      )}
    </div>
  );
}
