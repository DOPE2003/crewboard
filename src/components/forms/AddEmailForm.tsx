"use client";

import { useState } from "react";
import { saveNotificationEmail } from "@/actions/settings";

export default function AddEmailForm() {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "0.85rem 1rem", borderRadius: 10,
      background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)",
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#22c55e" }}>Email saved — you'll receive notifications at this address.</span>
    </div>
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await saveNotificationEmail(email);
    setSaving(false);
    if ("error" in result && result.error) { setError(result.error); return; }
    setDone(true);
  }

  return (
    <div style={{
      borderRadius: 12, border: "1.5px solid #f59e0b",
      background: "rgba(251,191,36,0.05)", padding: "1.1rem 1.25rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: "0.75rem" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--foreground)" }}>Add your email to receive notifications</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.5 }}>
            You signed in with X — add an email so Crewboard can notify you when you get a message, a hire request, or someone orders your service.
          </div>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={{
            flex: 1, minWidth: 200,
            padding: "0.6rem 0.85rem", borderRadius: 8,
            border: "1px solid var(--card-border)", background: "var(--card-bg)",
            fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: "var(--foreground)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={saving || !email.trim()}
          style={{
            padding: "0.6rem 1.25rem", borderRadius: 8,
            background: "var(--foreground)", color: "var(--background)",
            fontWeight: 700, fontSize: "0.78rem",
            border: "none", cursor: "pointer",
            opacity: saving ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? "Saving…" : "Save Email"}
        </button>
      </form>
      {error && <div style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "0.4rem" }}>{error}</div>}
    </div>
  );
}
