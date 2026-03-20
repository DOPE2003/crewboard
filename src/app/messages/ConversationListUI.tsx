"use client";

import { useState } from "react";
import Link from "next/link";

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
      <div className="msgs-sidebar-header">
        <div className="msgs-title">Messages</div>
        <div className="msgs-search-wrap">
          <svg className="msgs-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="msgs-search"
            placeholder="Search conversations..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="msgs-conv-list">
        {filtered.length === 0 && (
          <div className="msgs-empty">
            {q ? <p>No conversations match your search.</p> : (emptyContent ?? <p>No conversations yet.</p>)}
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
            if (item.lastMessage.startsWith("__GIGREQUEST__:")) {
              try {
                const gig = JSON.parse(item.lastMessage.slice("__GIGREQUEST__:".length));
                preview = prefix + `Gig Request: ${gig.title}`;
              } catch { preview = prefix + "Gig Request"; }
            } else {
              preview = prefix + item.lastMessage.slice(0, 50) + (item.lastMessage.length > 50 ? "…" : "");
            }
          }

          return (
            <Link
              key={item.id}
              href={`/messages/${item.id}`}
              className={`msgs-conv-row${active ? " active" : ""}`}
            >
              <div className="msgs-conv-avatar-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.user?.image ? (
                  <img src={item.user.image} alt="" className="msgs-conv-avatar-img" />
                ) : (
                  <div className="msgs-conv-avatar-fallback" />
                )}
                <span className={`msgs-online-dot${online ? " msgs-online-dot--on" : ""}`} />
              </div>
              <div className="msgs-conv-info">
                <div className="msgs-conv-top">
                  <span className="msgs-conv-name">
                    {item.user?.name ?? item.user?.twitterHandle ?? "Unknown"}
                  </span>
                  <span className="msgs-conv-ts">{convTimestamp(item.updatedAt)}</span>
                </div>
                <div className="msgs-conv-preview">{preview}</div>
              </div>
              {item.unread > 0 && (
                <div className="msgs-unread-badge">{item.unread}</div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
