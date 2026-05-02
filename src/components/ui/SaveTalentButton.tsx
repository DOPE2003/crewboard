"use client";

import { useState } from "react";
import { toggleSaveTalent } from "@/actions/talent";

export default function SaveTalentButton({
  targetUserId,
  initialSaved,
}: {
  targetUserId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await toggleSaveTalent(targetUserId);
      setSaved(res.saved);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      style={{
        width: "100%",
        padding: "0.75rem",
        borderRadius: 99,
        background: saved ? "rgba(45,212,191,0.07)" : "#f1f5f9",
        color: saved ? "#0d9488" : "#475569",
        fontWeight: 700,
        fontSize: "0.8rem",
        border: saved ? "1px solid rgba(45,212,191,0.25)" : "1px solid #e2e8f0",
        cursor: loading ? "default" : "pointer",
        letterSpacing: "0.03em",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {loading ? "..." : saved ? "Saved" : "Save Talent"}
    </button>
  );
}
