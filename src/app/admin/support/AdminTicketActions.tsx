"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicketStatus } from "@/actions/support";

const STATUSES = [
  { value: "open",         label: "Open" },
  { value: "in-progress",  label: "In Progress" },
  { value: "resolved",     label: "Resolved" },
  { value: "closed",       label: "Closed" },
] as const;

type Status = typeof STATUSES[number]["value"];

export default function AdminTicketActions({
  ticketId,
  currentStatus,
  currentNote,
}: {
  ticketId: string;
  currentStatus: string;
  currentNote: string;
}) {
  const [open, setOpen]     = useState(false);
  const [status, setStatus] = useState<Status>(currentStatus as Status);
  const [note, setNote]     = useState(currentNote);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      await updateTicketStatus({ ticketId, status, staffNote: note });
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "6px 12px", borderRadius: 8, border: "1px solid var(--card-border)",
          background: "var(--background)", color: "var(--text-muted)",
          fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 4,
        }}
      >
        Respond
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
          background: "var(--card-bg)", border: "1px solid var(--card-border)",
          borderRadius: 12, padding: "1rem", width: 280,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Status
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  style={{
                    padding: "4px 10px", borderRadius: 99, fontSize: "0.72rem", fontWeight: 600,
                    border: "1px solid " + (status === s.value ? "#14b8a6" : "var(--card-border)"),
                    background: status === s.value ? "rgba(20,184,166,0.1)" : "transparent",
                    color: status === s.value ? "#14b8a6" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
              Reply to user (optional)
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Write a note visible to the user…"
              maxLength={1000}
              style={{
                width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8,
                border: "1px solid var(--card-border)", background: "var(--background)",
                color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit",
                outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button
              onClick={() => setOpen(false)}
              style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "#14b8a6", color: "#0f172a", fontSize: "0.75rem", fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "inherit" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
