"use client";

import { useState } from "react";
import Link from "next/link";

function msgPreview(body: string, maxLen = 50): string {
  if (body.startsWith("__GIGREQUEST__:")) {
    try { return "Gig Request: " + JSON.parse(body.slice("__GIGREQUEST__:".length)).title; }
    catch { return "Gig Request"; }
  }
  if (body.startsWith("__FILE__:")) {
    try {
      const f = JSON.parse(body.slice("__FILE__:".length));
      if (f.type?.startsWith("image/")) return "📷 Image";
      if (f.type?.startsWith("video/")) return "🎥 Video";
      return "📄 " + f.name;
    } catch { return "📎 File"; }
  }
  return body.slice(0, maxLen) + (body.length > maxLen ? "…" : "");
}

function convTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export interface ConvItem {
  id: string;
  updatedAt: string;
  lastMessage: string | null;
  lastSenderId: string | null;
  unread: number;
  user: {
    id: string;
    name: string | null;
    twitterHandle: string;
    image: string | null;
    lastSeenAt: string | null;
  } | null;
}

export default function ConversationListUI({
  items,
  activeId,
  currentUserId,
  emptyContent,
}: {
  items: ConvItem[];
  activeId?: string;
  currentUserId: string;
  emptyContent?: React.ReactNode;
}) {
  const [q, setQ] = useState("");

  const filtered = items.filter((item) => {
    if (!q.trim()) return true;
    const name = (item.user?.name ?? item.user?.twitterHandle ?? "").toLowerCase();
    return name.includes(q.toLowerCase());
  });

  return (
    <>
      {/* Sidebar header */}
      <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid var(--card-border)", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>
          Messages
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="msgs-search"
            placeholder="Search conversations..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%", height: 38, paddingLeft: 34, paddingRight: 12,
              border: "1px solid var(--card-border)", borderRadius: 10,
              background: "var(--background)", color: "var(--foreground)",
              fontFamily: "Inter, sans-serif", fontSize: 13, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{
            padding: "2rem 1rem", display: "flex", flexDirection: "column",
            alignItems: "center", textAlign: "center", gap: "0.5rem",
            color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.7,
          }}>
            {q ? <p style={{ margin: 0 }}>No conversations match your search.</p> : (emptyContent ?? <p style={{ margin: 0 }}>No conversations yet.</p>)}
          </div>
        )}

        {filtered.map((item) => {
          const online = item.user?.lastSeenAt
            ? (Date.now() - new Date(item.user.lastSeenAt).getTime()) < 3 * 60 * 1000
            : false;
          const active = item.id === activeId;

          let preview = "No messages yet";
          if (item.lastMessage !== null) {
            const prefix = item.lastSenderId === currentUserId ? "You: " : "";
            preview = prefix + msgPreview(item.lastMessage, 50);
          }

          const displayName = item.user?.name ?? (item.user?.twitterHandle ? `@${item.user.twitterHandle}` : "Unknown User");

          return (
            <Link
              key={item.id}
              href={`/messages/${item.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                textDecoration: "none",
                borderBottom: "1px solid var(--card-border)",
                borderLeft: active ? "3px solid #14B8A6" : "3px solid transparent",
                background: active ? "rgba(20,184,166,0.07)" : "transparent",
                cursor: "pointer",
                minHeight: 76,
                boxSizing: "border-box",
                transition: "background 0.15s",
              }}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0, width: 46, height: 46 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.user?.image && (
                  <img
                    src={item.user.image}
                    alt=""
                    style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", display: "block" }}
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = "none";
                      const fb = t.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                )}
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: "linear-gradient(135deg, #14B8A6, #0F6E56)",
                  display: item.user?.image ? "none" : "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "white",
                  flexShrink: 0,
                }}>
                  {(item.user?.name ?? item.user?.twitterHandle ?? "U")[0].toUpperCase()}
                </div>
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: "50%",
                  background: online ? "#22c55e" : "var(--card-border)",
                  border: "2px solid var(--dropdown-bg)",
                }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: item.unread > 0 ? 700 : 600,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: 160,
                    fontFamily: "Inter, sans-serif",
                  }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>
                    {convTimestamp(item.updatedAt)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 12,
                    color: item.unread > 0 ? "var(--foreground)" : "var(--text-muted)",
                    fontWeight: item.unread > 0 ? 600 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: 185,
                    fontFamily: "Inter, sans-serif",
                  }}>
                    {preview}
                  </span>
                  {item.unread > 0 && (
                    <span style={{
                      background: "#14B8A6", color: "white",
                      fontSize: 10, fontWeight: 700,
                      minWidth: 20, height: 20, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, padding: "0 4px",
                      fontFamily: "Inter, sans-serif",
                    }}>
                      {item.unread > 9 ? "9+" : item.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
