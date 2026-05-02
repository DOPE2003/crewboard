"use client";

import { useState } from "react";
import { saveNotificationEmail } from "@/actions/settings";

interface Props {
  currentEmail?: string | null;
}

export default function AddEmailForm({ currentEmail }: Props) {
  const [editing, setEditing] = useState(!currentEmail); // open by default if no email
  const [email, setEmail] = useState(currentEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await saveNotificationEmail(email);
    setSaving(false);
    if ("error" in result && result.error) { setError(result.error); return; }
    setSaved(true);
    setEditing(false);
  }

  // ── Has email + not editing → show display row ──
  if (currentEmail && !editing) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        padding: "0.75rem 1rem", borderRadius: 10,
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 1 }}>
              Notification Email
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {saved ? email : currentEmail}
            </div>
          </div>
        </div>
        <button
          onClick={() => { setEditing(true); setSaved(false); }}
          style={{
            padding: "0.4rem 0.85rem", borderRadius: 7, flexShrink: 0,
            background: "transparent", border: "1px solid var(--card-border)",
            fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          Change
        </button>
      </div>
    );
  }

  // ── No email or editing → show form ──
  return (
    <div style={{
      borderRadius: 12,
      border: currentEmail ? "1px solid var(--card-border)" : "1.5px solid #f59e0b",
      background: currentEmail ? "var(--card-bg)" : "rgba(251,191,36,0.05)",
      padding: "1rem 1.1rem",
    }}>
      {!currentEmail && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: "0.65rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--foreground)" }}>Add your email to receive notifications</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>
              Add an email so Crewboard can notify you about messages, orders, and hire requests.
            </div>
          </div>
        </div>
      )}

      {currentEmail && (
        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          Change notification email
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoFocus={!!currentEmail}
          style={{
            flex: 1, minWidth: 180,
            padding: "0.55rem 0.85rem", borderRadius: 8,
            border: "1px solid var(--card-border)", background: "var(--background)",
            fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "var(--foreground)",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {currentEmail && (
            <button type="button" onClick={() => setEditing(false)} style={{ padding: "0.55rem 0.85rem", borderRadius: 8, background: "transparent", border: "1px solid var(--card-border)", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", cursor: "pointer" }}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !email.trim()}
            style={{
              padding: "0.55rem 1.1rem", borderRadius: 8,
              background: "var(--foreground)", color: "var(--background)",
              fontWeight: 700, fontSize: "0.78rem",
              border: "none", cursor: "pointer",
              opacity: saving ? 0.7 : 1, whiteSpace: "nowrap",
            }}
          >
            {saving ? "Saving…" : currentEmail ? "Update Email" : "Save Email"}
          </button>
        </div>
      </form>
      {error && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "0.4rem" }}>{error}</div>}
    </div>
  );
}
