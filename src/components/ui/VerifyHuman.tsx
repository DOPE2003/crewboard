"use client";

import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  humanVerified: boolean;
  worldIdLevel?: string | null;
  userId: string;
}

export default function VerifyHuman({ humanVerified }: Props) {
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
          Identity Verified
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "0.6rem 1.1rem", borderRadius: 10,
              background: "rgba(22,163,74,0.08)",
              border: "1px solid rgba(22,163,74,0.3)",
              color: "#15803d", fontSize: "0.8rem", fontWeight: 700,
              cursor: "pointer", width: "fit-content",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Verify Your Identity
          </button>
        )}
      </IDKitWidget>

      <div style={{ fontSize: "0.68rem", color: "#94a3b8", lineHeight: 1.65, maxWidth: 320 }}>
        Uses biometric iris scanning via the Worldcoin Orb — the strongest proof of unique human identity available. One person, one verification. Cannot be faked, bought, or duplicated.
      </div>

      {error && (
        <div style={{ fontSize: "0.72rem", color: "#ef4444" }}>{error}</div>
      )}
    </div>
  );
}
