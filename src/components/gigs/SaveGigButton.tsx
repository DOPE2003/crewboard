"use client";

import { useState, useTransition } from "react";
import { toggleSaveGig } from "@/actions/savedGigs";

interface Props {
  gigId: string;
  initialSaved: boolean;
}

export default function SaveGigButton({ gigId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault(); // don't navigate when inside a Link
    e.stopPropagation();
    startTransition(async () => {
      const result = await toggleSaveGig(gigId);
      setSaved(result.saved);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? "Unsave service" : "Save service"}
      title={saved ? "Remove from saved jobs" : "Save this service"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 8,
        border: saved ? "1px solid #14B8A6" : "1px solid var(--card-border, #e5e7eb)",
        background: saved ? "rgba(20,184,166,0.08)" : "var(--card-bg, #ffffff)",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.6 : 1,
        transition: "all 0.15s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={saved ? "#14B8A6" : "none"}
        stroke={saved ? "#14B8A6" : "var(--text-muted, #9ca3af)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
}
