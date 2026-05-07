"use client";

import { useEffect, useRef, useState } from "react";
import { searchUsersForEmail, sendOwnerEmail } from "@/actions/owner-email";

type UserResult = {
  id: string;
  name: string | null;
  twitterHandle: string;
  email: string | null;
  image: string | null;
};

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
  marginBottom: 6,
};

export default function OwnerEmailForm() {
  const [search, setSearch]           = useState("");
  const [results, setResults]         = useState<UserResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showDrop, setShowDrop]       = useState(false);
  const [recipients, setRecipients]   = useState<UserResult[]>([]);

  const [subject, setSubject]         = useState("");
  const [title, setTitle]             = useState("");
  const [body, setBody]               = useState("");
  const [link, setLink]               = useState("");
  const [linkLabel, setLinkLabel]     = useState("");

  const [sending, setSending]         = useState(false);
  const [result, setResult]           = useState<string | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);

  // Debounced user search
  useEffect(() => {
    if (search.length < 2) { setResults([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchUsersForEmail(search);
        setResults(r);
        setShowDrop(true);
      } catch {}
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  function addRecipient(u: UserResult) {
    if (!recipients.find((r) => r.id === u.id)) {
      setRecipients((prev) => [...prev, u]);
    }
    setSearch("");
    setResults([]);
    setShowDrop(false);
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSend() {
    if (!recipients.length || !subject.trim() || !title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendOwnerEmail({
        userIds:   recipients.map((r) => r.id),
        subject,
        title,
        body,
        link:      link || undefined,
        linkLabel: linkLabel || undefined,
      });
      const parts = [`✓ Sent to ${res.sent}`];
      if (res.failed)  parts.push(`${res.failed} failed`);
      if (res.noEmail) parts.push(`${res.noEmail} had no email`);
      setResult(parts.join(" · "));
      setRecipients([]);
      setSubject("");
      setTitle("");
      setBody("");
      setLink("");
      setLinkLabel("");
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  }

  const canSend = recipients.length > 0 && subject.trim() && title.trim() && body.trim() && !sending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      {/* Recipients */}
      <div>
        <label style={labelStyle}>Recipients ({recipients.length})</label>

        {/* Selected chips */}
        {recipients.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {recipients.map((u) => (
              <span key={u.id} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px 4px 8px", borderRadius: 99,
                background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.3)",
                fontSize: "0.75rem", fontWeight: 600, color: "#14b8a6",
              }}>
                {u.image && (
                  <img src={u.image} alt="" style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                )}
                @{u.twitterHandle}
                {u.email && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({u.email})</span>}
                <button
                  onClick={() => removeRecipient(u.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#14b8a6", padding: 0, lineHeight: 1, fontSize: "0.9rem",
                    display: "flex", alignItems: "center",
                  }}
                  aria-label="Remove"
                >×</button>
              </span>
            ))}
          </div>
        )}

        {/* Search input + dropdown */}
        <div style={{ position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="Search by name, @handle, or email…"
            style={inputStyle}
          />
          {searching && (
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              searching…
            </span>
          )}

          {showDrop && results.length > 0 && (
            <div
              ref={dropRef}
              style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                background: "var(--card-bg)", border: "1px solid var(--card-border)",
                borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              {results.map((u) => {
                const already = !!recipients.find((r) => r.id === u.id);
                return (
                  <button
                    key={u.id}
                    onMouseDown={(e) => { e.preventDefault(); addRecipient(u); }}
                    disabled={already}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "0.7rem 1rem", border: "none", background: "transparent",
                      cursor: already ? "default" : "pointer", textAlign: "left",
                      borderBottom: "1px solid var(--card-border)", fontFamily: "inherit",
                      opacity: already ? 0.45 : 1,
                    }}
                  >
                    {u.image
                      ? <img src={u.image} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#14b8a6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {(u.name ?? u.twitterHandle)[0].toUpperCase()}
                        </div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {u.name ?? u.twitterHandle}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        @{u.twitterHandle}{u.email ? ` · ${u.email}` : " · no email"}
                      </div>
                    </div>
                    {already && (
                      <span style={{ fontSize: "0.65rem", color: "#14b8a6", fontWeight: 600, flexShrink: 0 }}>added</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {showDrop && !searching && results.length === 0 && search.length >= 2 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
              background: "var(--card-bg)", border: "1px solid var(--card-border)",
              borderRadius: 10, padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}>
              No users found for "{search}"
            </div>
          )}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label style={labelStyle}>Subject line</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Important update from Crewboard"
          maxLength={150}
          style={inputStyle}
        />
      </div>

      {/* Title (shown as H2 in email) */}
      <div>
        <label style={labelStyle}>Email heading</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Your account has been upgraded"
          maxLength={100}
          style={inputStyle}
        />
      </div>

      {/* Body */}
      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the email body here…"
          rows={4}
          maxLength={2000}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* CTA link */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={labelStyle}>Button link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/dashboard or full URL"
            maxLength={300}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Button label (optional)</label>
          <input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="View on Crewboard"
            maxLength={60}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Send row */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingTop: "0.25rem" }}>
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            padding: "0.6rem 1.5rem", borderRadius: 10, border: "none",
            background: canSend ? "#14b8a6" : "var(--card-border)",
            color: canSend ? "#0f172a" : "var(--text-muted)",
            fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
            cursor: sending ? "wait" : canSend ? "pointer" : "default",
            transition: "background 0.15s",
          }}
        >
          {sending ? "Sending…" : `Send Email${recipients.length > 1 ? ` (${recipients.length})` : ""}`}
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
