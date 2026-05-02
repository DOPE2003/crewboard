"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendFirstMessage } from "@/actions/messages";

export default function NewConversationThread({
  recipientId,
  recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const { conversationId } = await sendFirstMessage(recipientId, text);
      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to send. Try again.");
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background)" }}>

      {/* Empty thread body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "2rem", color: "var(--text-muted)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p style={{ margin: 0, fontSize: 13, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
          This is the start of your conversation with <strong style={{ color: "var(--foreground)" }}>{recipientName}</strong>. Send a message to begin.
        </p>
      </div>

      {/* Input bar */}
      {error && (
        <div style={{ padding: "8px 14px", background: "#fee2e2", borderTop: "1px solid #fecaca", fontSize: 12, color: "#dc2626" }}>
          {error}
        </div>
      )}
      <div style={{ borderTop: "1px solid var(--card-border)", padding: "12px 14px", background: "var(--dropdown-bg)", display: "flex", alignItems: "flex-end", gap: 8 }}>
        <textarea
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${recipientName}…`}
          rows={1}
          disabled={sending}
          style={{
            flex: 1, resize: "none", border: "1px solid var(--card-border)", borderRadius: 12,
            padding: "10px 14px", fontSize: 14, background: "var(--background)", color: "var(--foreground)",
            outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", fontFamily: "inherit",
          }}
        />
        <button
          onClick={send}
          disabled={!body.trim() || sending}
          style={{
            width: 40, height: 40, borderRadius: "50%", border: "none", cursor: body.trim() && !sending ? "pointer" : "default",
            background: body.trim() && !sending ? "#14B8A6" : "var(--card-border)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
