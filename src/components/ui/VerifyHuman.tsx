"use client";

import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  humanVerified: boolean;
  worldIdLevel?: string | null;
  userId: string;
}

export default function VerifyHuman({ humanVerified, worldIdLevel }: Props) {
  const [error, setError] = useState("");
  const router = useRouter();

  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID as `app_${string}` | undefined;
  const action = process.env.NEXT_PUBLIC_WORLDCOIN_ACTION ?? "verify-human";

  const handleVerify = async (result: ISuccessResult) => {
    const res = await fetch("/api/verify/worldid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Verification failed");
    }
  };

  const onSuccess = () => {
    router.refresh();
  };

  if (humanVerified) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>
          Human Verified{worldIdLevel === "orb" ? " (Orb)" : " (Device)"}
        </span>
      </div>
    );
  }

  if (!appId) {
    return (
      <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
        World ID not configured — add NEXT_PUBLIC_WORLDCOIN_APP_ID to env.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.6 }}>
        Prove you are a real, unique human using World ID. Your biometric data never leaves your phone.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Device level — phone-based, no Orb needed */}
        <IDKitWidget
          app_id={appId}
          action={action}
          verification_level={VerificationLevel.Device}
          handleVerify={handleVerify}
          onSuccess={onSuccess}
        >
          {({ open }: { open: () => void }) => (
            <button
              onClick={() => { setError(""); open(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "0.55rem 1rem", borderRadius: 10,
                background: "rgba(22,163,74,0.07)",
                border: "1px solid rgba(22,163,74,0.25)",
                color: "#16a34a", fontSize: "0.78rem", fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              Verify with Device
            </button>
          )}
        </IDKitWidget>

        {/* Orb level — strongest, requires biometric scan */}
        <IDKitWidget
          app_id={appId}
          action={action}
          verification_level={VerificationLevel.Orb}
          handleVerify={handleVerify}
          onSuccess={onSuccess}
        >
          {({ open }: { open: () => void }) => (
            <button
              onClick={() => { setError(""); open(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "0.55rem 1rem", borderRadius: 10,
                background: "rgba(22,163,74,0.12)",
                border: "1px solid rgba(22,163,74,0.35)",
                color: "#15803d", fontSize: "0.78rem", fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Verify with Orb (strongest)
            </button>
          )}
        </IDKitWidget>
      </div>

      {error && (
        <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 2 }}>{error}</div>
      )}
    </div>
  );
}
