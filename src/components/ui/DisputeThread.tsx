"use client";

import { useState, useRef, useEffect } from "react";
import { addDisputeMessage, adminResolveDispute } from "@/actions/disputes";
import { useRouter } from "next/navigation";

interface Msg {
  id: string;
  body: string;
  isSystem: boolean;
  createdAt: string;
  isMine: boolean;
  sender: { name: string | null; twitterHandle: string | null; image: string | null } | null;
}
interface Evidence {
  id: string;
  type: string;
  url: string | null;
  text: string | null;
  createdAt: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DisputeThread({
  disputeId, messages, evidence, canReply, isAdmin,
}: {
  disputeId: string;
  messages: Msg[];
  evidence: Evidence[];
  canReply: boolean;
  isAdmin: boolean;
  orderId?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const [decision, setDecision] = useState<"refund" | "release">("refund");
  const [notes, setNotes] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveErr, setResolveErr] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function send() {
    if (!body.trim()) return;
    setSending(true); setErr("");
    try {
      await addDisputeMessage(disputeId, body.trim(), url.trim() || undefined);
      setBody(""); setUrl("");
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  async function resolve() {
    if (!confirm(`Resolve dispute as "${decision}"? This is irreversible.`)) return;
    setResolving(true); setResolveErr("");
    try {
      await adminResolveDispute(disputeId, decision, notes);
      router.refresh();
    } catch (e: any) {
      setResolveErr(e.message ?? "Failed.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Message thread */}
      <div style={{ background: "var(--dropdown-bg)", borderRadius: 14, border: "1px solid var(--card-border)", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--card-border)", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Dispute Thread
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", padding: "2rem 0" }}>No messages yet.</div>
          )}
          {messages.map((m) => {
            if (m.isSystem) return (
              <div key={m.id} style={{ textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.4rem 0" }}>
                <span style={{ background: "var(--card-border)", padding: "3px 12px", borderRadius: 99 }}>{m.body}</span>
              </div>
            );
            return (
              <div key={m.id} style={{ display: "flex", gap: 10, flexDirection: m.isMine ? "row-reverse" : "row" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "#14b8a6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.sender?.image
                    ? <img src={m.sender.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    : <span style={{ fontSize: "0.65rem", color: "#fff", fontWeight: 700 }}>{(m.sender?.name ?? m.sender?.twitterHandle ?? "?")[0].toUpperCase()}</span>
                  }
                </div>
                <div style={{ maxWidth: "72%" }}>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: 3, textAlign: m.isMine ? "right" : "left" }}>
                    @{m.sender?.twitterHandle} · {fmt(m.createdAt)}
                  </div>
                  <div style={{
                    padding: "0.55rem 0.85rem", borderRadius: 10, fontSize: "0.8rem", lineHeight: 1.55,
                    background: m.isMine ? "rgba(20,184,166,0.12)" : "rgba(var(--foreground-rgb),0.04)",
                    border: `1px solid ${m.isMine ? "rgba(20,184,166,0.2)" : "var(--card-border)"}`,
                    color: "var(--foreground)",
                  }}>
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply form */}
        {canReply && (
          <div style={{ padding: "1rem", borderTop: "1px solid var(--card-border)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a message or evidence description…"
              rows={3}
              style={{ width: "100%", resize: "vertical", padding: "0.65rem 0.85rem", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.82rem", lineHeight: 1.5, fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Evidence URL (optional — screenshot, doc, drive link…)"
              style={{ padding: "0.55rem 0.85rem", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {err && <span style={{ fontSize: "0.72rem", color: "#ef4444" }}>{err}</span>}
              <button
                onClick={send}
                disabled={sending || !body.trim()}
                style={{ marginLeft: "auto", padding: "0.55rem 1.25rem", borderRadius: 8, background: "#14b8a6", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.78rem", cursor: sending || !body.trim() ? "not-allowed" : "pointer", opacity: sending || !body.trim() ? 0.6 : 1 }}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Evidence list */}
      {evidence.length > 0 && (
        <div style={{ background: "var(--dropdown-bg)", borderRadius: 14, border: "1px solid var(--card-border)", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Evidence</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {evidence.map((ev) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(var(--foreground-rgb),0.03)", border: "1px solid var(--card-border)", fontSize: "0.78rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                {ev.url
                  ? <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: "#14b8a6", wordBreak: "break-all" }}>{ev.url}</a>
                  : <span style={{ color: "var(--text-muted)" }}>{ev.text}</span>
                }
                <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmt(ev.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin DB-only resolution (no on-chain — use admin panel for on-chain) */}
      {isAdmin && (
        <div style={{ background: "var(--dropdown-bg)", borderRadius: 14, border: "1px solid rgba(239,68,68,0.25)", padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.9rem" }}>Admin — Resolve (DB only)</div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {(["refund", "release"] as const).map((d) => (
              <button key={d} onClick={() => setDecision(d)} style={{ padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: decision === d ? (d === "refund" ? "#3b82f6" : "#22c55e") : "var(--card-border)", background: decision === d ? (d === "refund" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)") : "transparent", color: decision === d ? (d === "refund" ? "#3b82f6" : "#22c55e") : "var(--text-muted)" }}>
                {d === "refund" ? "Refund Buyer" : "Release to Seller"}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Resolution notes (optional)…"
            rows={2}
            style={{ width: "100%", resize: "vertical", padding: "0.6rem 0.85rem", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "0.78rem", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "0.75rem" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={resolve} disabled={resolving} style={{ padding: "0.6rem 1.4rem", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.78rem", cursor: resolving ? "wait" : "pointer", opacity: resolving ? 0.6 : 1 }}>
              {resolving ? "Resolving…" : "Confirm Resolution"}
            </button>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>For on-chain release use the <a href="/admin/disputes" style={{ color: "#14b8a6" }}>Admin panel</a>.</span>
          </div>
          {resolveErr && <div style={{ marginTop: "0.6rem", fontSize: "0.72rem", color: "#ef4444" }}>{resolveErr}</div>}
        </div>
      )}
    </div>
  );
}
