"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAllConversationsRead } from "@/actions/messages";

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
  const [markingAll, setMarkingAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 60, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => { setConvs(conversations); }, [conversations]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isOpen, isMobile]);

  async function handleMarkAllRead() {
    const prev = convs;
    setMarkingAll(true);
    setConvs((c) => c.map((x) => ({ ...x, unread: 0 })));
    try {
      await markAllConversationsRead();
      router.refresh();
    } catch {
      setConvs(prev);
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = convs.some((c) => c.unread > 0);
  const listed = convs.slice(0, 5);

  const panelInner = (
    <>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 12px",
        borderBottom: "1px solid var(--card-border)",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--foreground)" }}>
          Messages
          {totalUnread > 0 && (
            <span style={{
              background: "#14b8a6", color: "#fff", borderRadius: "999px",
              fontSize: "0.6rem", fontWeight: 700, padding: "1px 7px", marginLeft: 8,
              fontFamily: "Inter, sans-serif", verticalAlign: "middle",
            }}>
              {totalUnread}
            </span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#14b8a6",
                background: "none", border: "none", cursor: markingAll ? "default" : "pointer",
                fontWeight: 600, padding: 0, opacity: markingAll ? 0.5 : 1,
              }}
            >
              Mark all read
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--text-muted)", display: "flex" }}
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
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)" }}>
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
                borderBottom: "1px solid var(--card-border)",
                background: unread > 0 ? "rgba(20,184,166,0.06)" : "transparent",
                transition: "background 0.12s",
                textDecoration: "none",
                position: "relative",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = unread > 0 ? "rgba(20,184,166,0.06)" : "transparent")}
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
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--avatar-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 9, height: 9, borderRadius: "50%",
                  background: online ? "#22c55e" : "var(--card-border)",
                  border: "2px solid var(--dropdown-bg)",
                }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 4 }}>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: "0.875rem",
                    fontWeight: unread > 0 ? 700 : 500, color: "var(--foreground)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.otherUser?.name ?? c.otherUser?.twitterHandle ?? "Unknown"}
                  </span>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: "0.68rem",
                    color: "var(--text-muted)", flexShrink: 0,
                  }}>
                    {fmtTime(c.lastMessageTime)}
                  </span>
                </div>
                <div style={{
                  fontFamily: "Inter, sans-serif", fontSize: "0.75rem",
                  color: "var(--text-muted)",
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
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--card-border)", flexShrink: 0 }}>
        <Link
          href="/messages"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: isMobile ? 50 : 36,
            width: "100%",
            fontFamily: "Inter, sans-serif", fontWeight: 600,
            fontSize: "0.8rem",
            color: "#14b8a6",
            border: "1px solid #14b8a6",
            borderRadius: 8,
            textDecoration: "none",
            background: "transparent",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(20,184,166,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          View all messages
        </Link>
      </div>
    </>
  );

  const desktopStyle: React.CSSProperties = {
    position: "fixed",
    top: panelPos.top,
    right: panelPos.right,
    width: 380,
    borderRadius: 12,
    zIndex: 9999,
    background: "var(--dropdown-bg)",
    border: "1px solid var(--card-border)",
    boxShadow: "var(--shadow-dropdown)",
    maxHeight: 480,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const mobileStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: "20px 20px 0 0",
    zIndex: 9999,
    background: "var(--dropdown-bg)",
    maxHeight: "75vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.25)",
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-label="Messages"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 8, background: "none",
          border: "none", cursor: "pointer", position: "relative",
          color: "var(--text-muted)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {totalUnread > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 15, height: 15, borderRadius: "999px",
            background: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.48rem", fontWeight: 700,
            color: "#fff", lineHeight: 1, padding: "0 3px",
          }}>
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Portal — desktop dropdown + mobile bottom sheet */}
      {isOpen && createPortal(
        <>
          <div
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: isMobile ? "rgba(0,0,0,0.4)" : "transparent",
            }}
          />
          <div style={isMobile ? mobileStyle : desktopStyle}>
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "0.75rem 0 0.25rem", flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--card-border)" }} />
              </div>
            )}
            {panelInner}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
