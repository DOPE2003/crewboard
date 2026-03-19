"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAllNotificationsAsRead, markNotificationRead } from "@/actions/notifications";

export interface NavNotif {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface Props {
  notifications: NavNotif[];
  unreadCount: number;
  hasIncompleteOnboarding?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function fmtTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function notifIcon(type: string) {
  if (type === "message") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  if (type === "order") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="12" y2="16"/>
    </svg>
  );
  if (type === "profile_view") return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function iconBg(type: string): string {
  if (type === "message") return "rgba(20,184,166,0.12)";
  if (type === "order") return "rgba(245,158,11,0.12)";
  if (type === "profile_view") return "rgba(139,92,246,0.12)";
  return "rgba(100,116,139,0.10)";
}

export default function NavNotificationsDropdown({ notifications: initialNotifs, unreadCount: initialUnread, hasIncompleteOnboarding = false, isOpen, onOpen, onClose }: Props) {
  const [notifs, setNotifs] = useState<NavNotif[]>(initialNotifs);
  const [unread, setUnread] = useState(initialUnread);
  const [markingAll, setMarkingAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 60, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    setNotifs(initialNotifs);
    setUnread(initialUnread);
  }, [initialNotifs, initialUnread]);

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

  async function handleMarkAll() {
    const prevNotifs = notifs;
    const prevUnread = unread;
    setMarkingAll(true);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await markAllNotificationsAsRead();
      router.refresh();
    } catch {
      setNotifs(prevNotifs);
      setUnread(prevUnread);
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleClick(n: NavNotif) {
    onClose();
    if (!n.read) {
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      setUnread((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => {
        setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: false } : x));
        setUnread((c) => c + 1);
      });
    }
  }

  const listed = notifs.slice(0, 5);

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
          Notifications
          {unread > 0 && (
            <span style={{
              background: "#14b8a6", color: "#fff", borderRadius: "999px",
              fontSize: "0.6rem", fontWeight: 700, padding: "1px 7px", marginLeft: 8,
              fontFamily: "Inter, sans-serif", verticalAlign: "middle",
            }}>
              {unread}
            </span>
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              style={{
                fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#14b8a6",
                background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0,
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

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {listed.length === 0 ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            No notifications yet
          </div>
        ) : listed.map((n) => (
          <Link
            key={n.id}
            href={n.link ?? "/notifications"}
            onClick={() => handleClick(n)}
            style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              padding: "10px 14px",
              borderBottom: "1px solid var(--card-border)",
              background: n.read ? "transparent" : "rgba(20,184,166,0.06)",
              textDecoration: "none",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(20,184,166,0.06)")}
          >
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: iconBg(n.type),
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {notifIcon(n.type)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                <span style={{
                  fontFamily: "Inter, sans-serif", fontSize: "0.875rem",
                  fontWeight: n.read ? 500 : 700, color: "var(--foreground)", lineHeight: 1.35,
                }}>
                  {n.title}
                </span>
                {!n.read && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: "0.75rem",
                color: "var(--text-muted)", marginTop: 2, lineHeight: 1.45,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {n.body}
              </div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: "0.68rem",
                color: "var(--text-muted)", marginTop: 4,
                textAlign: "right",
              }}>
                {fmtTime(n.createdAt)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px", borderTop: "1px solid var(--card-border)", flexShrink: 0 }}>
        <Link
          href="/notifications"
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
          View all notifications
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
        aria-label="Notifications"
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 15, height: 15, borderRadius: "999px",
            background: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.48rem", fontWeight: 700,
            color: "#fff", lineHeight: 1, padding: "0 3px",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {unread === 0 && hasIncompleteOnboarding && (
          <span style={{
            position: "absolute", top: 3, right: 3,
            width: 8, height: 8, borderRadius: "50%",
            background: "#f59e0b",
            border: "1.5px solid var(--nav-bg)",
          }} />
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
