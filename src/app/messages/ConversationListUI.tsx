"use client";

import { useState } from "react";
import Link from "next/link";

function msgPreview(body: string, maxLen = 50): string {
  if (body.startsWith("__GIGREQUEST__:")) {
    try { return "Service Request: " + JSON.parse(body.slice("__GIGREQUEST__:".length)).title; }
    catch { return "Service Request"; }
  }
  if (body.startsWith("__OFFER__:")) {
    try {
      const o = JSON.parse(body.slice("__OFFER__:".length));
      return `Custom Offer: ${o.title ?? "Offer"} — $${o.amount ?? ""}`;
    } catch { return "Custom Offer"; }
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
  if (d.getTime() === today.getTime())
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  // Deal context
  gigTitle?: string | null;
  orderId?: string | null;
  orderAmount?: number | null;
  orderStatus?: string | null;
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

  // Sort: unread first, then by updatedAt
  const sorted = [...items].sort((a, b) => {
    if (a.unread > 0 && b.unread === 0) return -1;
    if (a.unread === 0 && b.unread > 0) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filtered = sorted.filter((item) => {
    if (!q.trim()) return true;
    const name = (item.user?.name ?? item.user?.twitterHandle ?? "").toLowerCase();
    const gig = (item.gigTitle ?? "").toLowerCase();
    return name.includes(q.toLowerCase()) || gig.includes(q.toLowerCase());
  });

  return (
    <>
      {/* Sidebar header */}
      <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid var(--card-border)", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)", marginBottom: 12 }}>
          Messages
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="msgs-search"
            placeholder="Search people or services…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              width: "100%", height: 36, paddingLeft: 34, paddingRight: 12,
              border: "1px solid var(--card-border)", borderRadius: 10,
              background: "var(--background)", color: "var(--foreground)",
              fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.7 }}>
            {q
              ? <p style={{ margin: 0 }}>No conversations match your search.</p>
              : (emptyContent ?? <p style={{ margin: 0 }}>No messages yet.</p>)
            }
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
          const hasOrder = !!item.orderId;
          const orderStatusColor =
            item.orderStatus === "delivered" ? "#8b5cf6" :
            item.orderStatus === "completed" ? "#22c55e" :
            item.orderStatus === "funded" || item.orderStatus === "accepted" ? "#3b82f6" :
            "#94a3b8";

          return (
            <Link
              key={item.id}
              href={`/messages/${item.id}`}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                textDecoration: "none",
                borderBottom: "1px solid var(--card-border)",
                borderLeft: active ? "3px solid #14B8A6" : "3px solid transparent",
                background: active ? "rgba(20,184,166,0.06)" : item.unread > 0 ? "rgba(20,184,166,0.02)" : "transparent",
                cursor: "pointer",
                transition: "background 0.12s",
                boxSizing: "border-box",
              }}
            >
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                {item.user?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.user.image}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }}
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = "none";
                      const fb = t.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "linear-gradient(135deg, #14B8A6, #0F6E56)",
                  display: item.user?.image ? "none" : "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color: "white", flexShrink: 0,
                }}>
                  {(item.user?.name ?? item.user?.twitterHandle ?? "U")[0].toUpperCase()}
                </div>
                {/* Online dot */}
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 10, height: 10, borderRadius: "50%",
                  background: online ? "#22c55e" : "var(--card-border)",
                  border: "2px solid var(--dropdown-bg)",
                }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name + time */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{
                    fontSize: 13, fontWeight: item.unread > 0 ? 700 : 600,
                    color: "var(--foreground)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150,
                  }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                    {convTimestamp(item.updatedAt)}
                  </span>
                </div>

                {/* Deal context pill */}
                {hasOrder && item.gigTitle && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99,
                      background: `${orderStatusColor}15`, color: orderStatusColor,
                      border: `1px solid ${orderStatusColor}35`,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170,
                    }}>
                      {item.orderAmount ? `$${item.orderAmount} · ` : ""}{item.gigTitle}
                    </span>
                  </div>
                )}

                {/* Last message + unread */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 12, color: item.unread > 0 ? "var(--foreground)" : "var(--text-muted)",
                    fontWeight: item.unread > 0 ? 600 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180,
                  }}>
                    {preview}
                  </span>
                  {item.unread > 0 && (
                    <span style={{
                      background: "#14B8A6", color: "white",
                      fontSize: 10, fontWeight: 700,
                      minWidth: 18, height: 18, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, padding: "0 3px",
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
