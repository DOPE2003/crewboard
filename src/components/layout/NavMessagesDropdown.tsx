"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function isOnline(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 3 * 60 * 1000;
}

export default function NavMessagesDropdown({ conversations, totalUnread, isOpen, onOpen, onClose }: Props) {
  const [convs, setConvs] = useState(conversations);
  const [isMobile, setIsMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setConvs(conversations); }, [conversations]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile, onClose]);

  function handleMarkAllRead() {
    setConvs((prev) => prev.map((c) => ({ ...c, unread: 0 })));
  }

  const hasUnread = convs.some((c) => c.unread > 0);
  const listed = convs.slice(0, 5);

  const panelInner = (
    <>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
          Messages
          {totalUnread > 0 && (
            <span style={{
              background: "#14b8a6", color: "#fff", borderRadius: "999px",
              fontSize: "0.6rem", fontWeight: 700, padding: "1px 7px", marginLeft: 8,
              fontFamily: "Space Mono, monospace", verticalAlign: "middle",
            }}>
              {totalUnread}
            </span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              style={{
                fontFamily: "Outfit, sans-serif", fontSize: "0.72rem", color: "#14b8a6",
                background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0,
              }}
            >
              Mark all read
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(0,0,0,0.4)", display: "flex" }}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Conversations list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {listed.length === 0 ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", color: "rgba(0,0,0,0.4)" }}>
            No conversations yet
          </div>
        ) : listed.map((c) => {
          const online = isOnline(c.otherUser?.lastSeenAt ?? null);
          const unread = convs.find((x) => x.id === c.id)?.unread ?? c.unread;
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "10px 14px",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                background: unread > 0 ? "rgba(20,184,166,0.04)" : "transparent",
                transition: "background 0.12s",
                textDecoration: "none",
                position: "relative",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = unread > 0 ? "rgba(20,184,166,0.04)" : "transparent")}
            >
              {/* Unread dot */}
              <div style={{ width: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {unread > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", display: "block" }} />
                )}
              </div>

              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {c.otherUser?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.otherUser.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 9, height: 9, borderRadius: "50%",
                  background: online ? "#22c55e" : "#cbd5e1",
                  border: "2px solid #fff",
                }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 4 }}>
                  <span style={{
                    fontFamily: "Outfit, sans-serif", fontSize: "0.875rem",
                    fontWeight: unread > 0 ? 700 : 500, color: "#0f172a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.otherUser?.name ?? c.otherUser?.twitterHandle ?? "Unknown"}
                  </span>
                  <span style={{
                    fontFamily: "Outfit, sans-serif", fontSize: "0.68rem",
                    color: "rgba(0,0,0,0.35)", flexShrink: 0,
                  }}>
                    {fmtTime(c.lastMessageTime)}
                  </span>
                </div>
                <div style={{
                  fontFamily: "Outfit, sans-serif", fontSize: "0.75rem",
                  color: unread > 0 ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.38)",
                  fontWeight: unread > 0 ? 500 : 400,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginTop: 2,
                }}>
                  {c.lastMessage ?? "No messages yet"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
        <Link
          href="/messages"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: isMobile ? 50 : 36,
            width: "100%",
            fontFamily: "Outfit, sans-serif", fontWeight: 600,
            fontSize: "0.8rem",
            color: "#14b8a6",
            border: "1px solid #14b8a6",
            borderRadius: 8,
            textDecoration: "none",
            background: "#fff",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(20,184,166,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          View all messages
        </Link>
      </div>
    </>
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger */}
      <button
        onClick={() => isOpen ? onClose() : onOpen()}
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
      </button>

      {/* Desktop dropdown */}
      {isOpen && !isMobile && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 380, borderRadius: 12, zIndex: 9999,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.09)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          maxHeight: 480,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {panelInner}
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isOpen && isMobile && createPortal(
        <div className="sheet-backdrop" onClick={onClose}>
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0.25rem", flexShrink: 0 }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: "#ccc" }} />
            </div>
            {panelInner}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
