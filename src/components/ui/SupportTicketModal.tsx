"use client";

import { useState } from "react";
import Modal from "./Modal";
import { submitTicket, type TicketCategory } from "@/actions/support";

const TICKET_CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "general",  label: "General question" },
  { value: "order",    label: "Order / delivery issue" },
  { value: "billing",  label: "Billing / payment" },
  { value: "account",  label: "Account / profile" },
  { value: "bug",      label: "Bug report" },
  { value: "other",    label: "Something else" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.85rem",
  borderRadius: 10,
  border: "1px solid var(--card-border)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: 5,
};

export default function SupportTicketModal({ isOpen, onClose }: Props) {
  const [category, setCategory] = useState<TicketCategory>("general");
  const [subject, setSubject]   = useState("");
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function reset() {
    setCategory("general"); setSubject(""); setBody("");
    setSending(false); setDone(false); setError(null);
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await submitTicket({ subject, category, body });
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Contact Support"
      footer={
        done ? (
          <button
            onClick={handleClose}
            style={{ padding: "0.55rem 1.5rem", borderRadius: 10, border: "none", background: "#14b8a6", color: "#0f172a", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            Done
          </button>
        ) : (
          <>
            <button
              onClick={handleClose}
              style={{ padding: "0.55rem 1.25rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "transparent", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={sending || !subject.trim() || !body.trim()}
              style={{
                padding: "0.55rem 1.5rem", borderRadius: 10, border: "none",
                background: sending || !subject.trim() || !body.trim() ? "var(--card-border)" : "#14b8a6",
                color: sending || !subject.trim() || !body.trim() ? "var(--text-muted)" : "#0f172a",
                fontWeight: 700, fontSize: "0.85rem",
                cursor: sending ? "wait" : "pointer", fontFamily: "inherit",
              }}
            >
              {sending ? "Sending…" : "Send Ticket"}
            </button>
          </>
        )
      }
    >
      {done ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", marginBottom: 8 }}>
            Ticket submitted!
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Our support team will review your message and get back to you. You can track your tickets at{" "}
            <a href="/support" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>/support</a>.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Category */}
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TICKET_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600,
                    border: "1px solid " + (category === c.value ? "#14b8a6" : "var(--card-border)"),
                    background: category === c.value ? "rgba(20,184,166,0.1)" : "transparent",
                    color: category === c.value ? "#14b8a6" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={labelStyle}>Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              maxLength={200}
              style={inputStyle}
            />
          </div>

          {/* Body */}
          <div>
            <label style={labelStyle}>Details</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Describe your issue in detail. Include any relevant order IDs, usernames, or steps to reproduce…"
              rows={5}
              maxLength={5000}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ textAlign: "right", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 3 }}>
              {body.length}/5000
            </div>
          </div>

          {error && (
            <div style={{ fontSize: "0.8rem", color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.6rem 0.85rem" }}>
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
