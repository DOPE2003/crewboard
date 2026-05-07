"use client";

import { useState } from "react";
import SupportTicketModal from "./SupportTicketModal";

export default function NewTicketButton({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: compact ? "6px 14px" : "8px 18px",
          borderRadius: 10, border: "none",
          background: "#14b8a6", color: "#0f172a",
          fontSize: compact ? "0.78rem" : "0.85rem",
          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {compact ? "New Ticket" : "Open a Ticket"}
      </button>
      <SupportTicketModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
