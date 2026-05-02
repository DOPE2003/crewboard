"use client";

import { useState } from "react";

export default function NotificationEmailForm({ currentEmail }: { currentEmail: string | null }) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed to save");
        setStatus("error");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setErrorMsg("Network error — try again");
      setStatus("error");
    }
  }

  const unchanged = email.trim().toLowerCase() === (currentEmail ?? "").toLowerCase();

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: 14,
      padding: "1.1rem 1.25rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
          Notification Email
        </span>
        {!currentEmail && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
            background: "rgba(239,68,68,0.1)", color: "#ef4444",
          }}>
            NOT SET — no emails sent to you
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 0.75rem", lineHeight: 1.5 }}>
        Used for message and order notifications. Twitter accounts often don&apos;t share an email — set one here to receive alerts.
      </p>

      <form onSubmit={handleSave} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
          placeholder="your@email.com"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "9px 12px",
            borderRadius: 9,
            border: "1px solid var(--card-border)",
            background: "var(--background)",
            color: "var(--foreground)",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={status === "saving" || unchanged}
          style={{
            padding: "9px 18px",
            borderRadius: 9,
            background: unchanged ? "var(--avatar-bg)" : "#14B8A6",
            color: unchanged ? "var(--text-muted)" : "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: unchanged ? "default" : "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
      </form>

      {status === "saved" && (
        <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#22c55e", fontWeight: 600 }}>
          Saved — you&apos;ll now receive email notifications.
        </p>
      )}
      {status === "error" && (
        <p style={{ margin: "0.5rem 0 0", fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
