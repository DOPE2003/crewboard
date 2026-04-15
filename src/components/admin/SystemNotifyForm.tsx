"use client";

import { useState } from "react";
import { sendSystemNotification } from "@/actions/system-notify";

const TARGETS = [
  { value: "all",        label: "All Users" },
  { value: "incomplete", label: "Incomplete Profiles" },
  { value: "complete",   label: "Complete Profiles" },
  { value: "no-gigs",    label: "No Services Posted" },
] as const;

export default function SystemNotifyForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [target, setTarget] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendSystemNotification({
        title,
        body,
        link: link || undefined,
        target: target as any,
      });
      setResult(`Sent to ${res.sent} users`);
      setTitle("");
      setBody("");
      setLink("");
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Target selector */}
      <div>
        <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
          Send to
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TARGETS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTarget(t.value)}
              style={{
                padding: "6px 14px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600,
                border: "1px solid " + (target === t.value ? "#14b8a6" : "var(--card-border)"),
                background: target === t.value ? "rgba(20,184,166,0.1)" : "transparent",
                color: target === t.value ? "#14b8a6" : "var(--text-muted)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Complete your profile"
          maxLength={100}
          style={{
            width: "100%", padding: "0.6rem 0.85rem", borderRadius: 10,
            border: "1px solid var(--card-border)", background: "var(--background)",
            color: "var(--foreground)", fontSize: "0.85rem", fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      {/* Body */}
      <div>
        <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
          Message
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g. Add a photo, bio, and skills to get hired faster."
          rows={3}
          maxLength={500}
          style={{
            width: "100%", padding: "0.6rem 0.85rem", borderRadius: 10,
            border: "1px solid var(--card-border)", background: "var(--background)",
            color: "var(--foreground)", fontSize: "0.85rem", fontFamily: "inherit",
            outline: "none", resize: "vertical",
          }}
        />
      </div>

      {/* Link (optional) */}
      <div>
        <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
          Link (optional)
        </label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/dashboard or /talent"
          maxLength={200}
          style={{
            width: "100%", padding: "0.6rem 0.85rem", borderRadius: 10,
            border: "1px solid var(--card-border)", background: "var(--background)",
            color: "var(--foreground)", fontSize: "0.85rem", fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      {/* Send button + result */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          style={{
            padding: "0.6rem 1.5rem", borderRadius: 10, border: "none",
            background: sending || !title.trim() || !body.trim() ? "var(--card-border)" : "#14b8a6",
            color: "#fff", fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
            cursor: sending ? "wait" : "pointer",
          }}
        >
          {sending ? "Sending..." : "Send Notification"}
        </button>
        {result && (
          <span style={{
            fontSize: "0.8rem", fontWeight: 600,
            color: result.startsWith("Error") ? "#ef4444" : "#22c55e",
          }}>
            {result}
          </span>
        )}
      </div>
    </div>
  );
}
