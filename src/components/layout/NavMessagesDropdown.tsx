"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ConvUser {
  id: string;
  name: string | null;
  twitterHandle: string;
  image: string | null;
  lastSeenAt: string | null;
}

interface Conv {
  id: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unread: number;
  otherUser: ConvUser | null;
}

interface Props {
  conversations: Conv[];
  totalUnread: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Offline";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Active now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function isOnline(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 3 * 60 * 1000;
}

export default function NavMessagesDropdown({ conversations, totalUnread, isOpen, onOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Click-outside (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]); // onClose always calls setOpenPanel(null) — stable behaviour

  const filtered = conversations
    .filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.otherUser?.name?.toLowerCase().includes(q) ||
        c.otherUser?.twitterHandle?.toLowerCase().includes(q)
      );
    })
    .slice(0, isMobile ? 5 : 8);

  const panelStyle: React.CSSProperties = isMobile ? {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderRadius: "20px 20px 0 0",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
    zIndex: 9999, maxHeight: "75vh",
    display: "flex", flexDirection: "column",
  } : {
    position: "absolute", top: "calc(100% + 10px)", right: 0,
    width: 320, borderRadius: 16, zIndex: 9999,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Messages button */}
      <Link
        href="/messages"
        aria-label="Messages"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 8, background: "none",
          border: "none", cursor: "pointer", position: "relative",
          color: "var(--text-muted)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#000"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(0,0,0,0.5)"; }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalUnread > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 15, height: 15, borderRadius: "999px",
            background: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Space Mono, monospace",
            fontSize: "0.48rem", fontWeight: 700,
            color: "#fff", lineHeight: 1, padding: "0 3px",
          }}>
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Link>

      {isOpen && (
        <>
          {/* Backdrop — mobile only */}
          {isMobile && (
            <div
              onClick={onClose}
              style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.4)" }}
            />
          )}

          {/* Panel */}
          <div style={panelStyle}>
            {/* Drag handle */}
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0.25rem", flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: "#ccc" }} />
              </div>
            )}

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", color: "#0f172a" }}>
                Messages
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link
                  href="/messages"
                  style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.72rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}
                  onClick={onClose}
                >
                  View all
                </Link>
                {isMobile && (
                  <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(0,0,0,0.4)", display: "flex" }}
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div style={{ padding: "0.6rem 0.75rem", borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                >
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem",
                    borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)",
                    background: "rgba(0,0,0,0.03)",
                    fontFamily: "Outfit, sans-serif", fontSize: "0.8rem", color: "#000",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Conversation list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0 && (
                <div style={{ padding: "1.5rem 1rem", textAlign: "center", fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", color: "rgba(0,0,0,0.4)" }}>
                  {query ? "No results found" : "No conversations yet"}
                </div>
              )}
              {filtered.map((c) => {
                const online = isOnline(c.otherUser?.lastSeenAt ?? null);
                const seen = timeAgo(c.otherUser?.lastSeenAt ?? null);
                return (
                  <Link
                    key={c.id}
                    href={`/messages/${c.id}`}
                    onClick={onClose}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0 16px", minHeight: 64, textDecoration: "none",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                      background: c.unread > 0 ? "rgba(20,184,166,0.04)" : "transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = c.unread > 0 ? "rgba(20,184,166,0.04)" : "transparent")}
                  >
                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {c.otherUser?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.otherUser.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                      )}
                      <span style={{
                        position: "absolute", bottom: 1, right: 1,
                        width: 10, height: 10, borderRadius: "50%",
                        background: online ? "#22c55e" : "#94a3b8",
                        border: "2px solid #fff",
                      }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.4rem" }}>
                        <span style={{
                          fontFamily: "Outfit, sans-serif", fontSize: "0.85rem", fontWeight: c.unread > 0 ? 700 : 500,
                          color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {c.otherUser?.name ?? c.otherUser?.twitterHandle ?? "Unknown"}
                        </span>
                        {c.unread > 0 && (
                          <span style={{
                            flexShrink: 0, background: "#14b8a6", color: "#fff",
                            borderRadius: "999px", fontSize: "0.55rem", fontWeight: 700,
                            padding: "1px 6px", fontFamily: "Space Mono, monospace",
                          }}>
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontFamily: "Outfit, sans-serif", fontSize: "0.72rem",
                        color: c.unread > 0 ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.42)",
                        fontWeight: c.unread > 0 ? 500 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        marginTop: 1,
                      }}>
                        {c.lastMessage ?? "No messages yet"}
                      </div>
                      <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.58rem", color: online ? "#22c55e" : "rgba(0,0,0,0.35)", marginTop: 2 }}>
                        {seen}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.75rem 16px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
              <Link
                href="/messages"
                onClick={onClose}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: isMobile ? 52 : "auto",
                  width: "100%",
                  fontFamily: "Rajdhani, sans-serif", fontWeight: 700,
                  fontSize: isMobile ? "0.85rem" : "0.72rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: isMobile ? "#fff" : "#0f172a",
                  background: isMobile ? "#0f172a" : "none",
                  borderRadius: isMobile ? 12 : 0,
                  textDecoration: "none",
                }}
              >
                Open Inbox
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
