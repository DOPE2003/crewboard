"use client";

import { useEffect, useRef, useState } from "react";
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
  createdAt: string; // ISO
}

interface Props {
  notifications: NavNotif[];
  unreadCount: number;
  hasIncompleteOnboarding?: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function notifIcon(type: string) {
  if (type === "message") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
  if (type === "profile_view") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  if (type === "order") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

export default function NavNotificationsDropdown({ notifications: initialNotifs, unreadCount: initialUnread, hasIncompleteOnboarding = false, isOpen, onOpen, onClose }: Props) {
  const [notifs, setNotifs] = useState<NavNotif[]>(initialNotifs);
  const [unread, setUnread] = useState(initialUnread);
  const [markingAll, setMarkingAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setNotifs(initialNotifs);
    setUnread(initialUnread);
  }, [initialNotifs, initialUnread]);

  // Click-outside (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]); // onClose is stable in behaviour

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
      router.refresh();
    }
    if (n.link) router.push(n.link);
  }

  const panelStyle: React.CSSProperties = isMobile ? {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderRadius: "20px 20px 0 0",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
    zIndex: 9999, maxHeight: "75vh",
    display: "flex", flexDirection: "column",
  } : {
    position: "absolute", top: "calc(100% + 10px)", right: 0,
    width: 340, borderRadius: 16, zIndex: 9999,
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Bell button */}
      <button
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-label="Notifications"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: 8, background: "none",
          border: "none", cursor: "pointer", position: "relative",
          color: isOpen ? "#000" : "rgba(0,0,0,0.5)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#000"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = isOpen ? "#000" : "rgba(0,0,0,0.5)"; }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4,
            minWidth: 15, height: 15, borderRadius: "999px",
            background: "#14b8a6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Space Mono, monospace",
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
            border: "1.5px solid #fff",
          }} />
        )}
      </button>

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
                Notifications {unread > 0 && (
                  <span style={{ background: "#14b8a6", color: "#fff", borderRadius: "999px", fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", marginLeft: 4, fontFamily: "Space Mono, monospace" }}>
                    {unread}
                  </span>
                )}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {unread > 0 && (
                  <button
                    onClick={handleMarkAll}
                    disabled={markingAll}
                    style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.68rem", color: "#64748b", background: "none", border: "none", cursor: "pointer", fontWeight: 500, padding: 0 }}
                  >
                    Mark all read
                  </button>
                )}
                <Link href="/notifications" style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.72rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }} onClick={onClose}>
                  View all
                </Link>
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

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifs.length === 0 ? (
                <div style={{ padding: "2rem 1rem", textAlign: "center", fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", color: "rgba(0,0,0,0.4)" }}>
                  No notifications yet
                </div>
              ) : (
                notifs.slice(0, isMobile ? 5 : 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    style={{
                      width: "100%", display: "flex", alignItems: "flex-start", gap: "0.75rem",
                      padding: isMobile ? "0 16px" : "0.75rem 1rem", minHeight: isMobile ? 60 : "auto", textAlign: "left",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                      background: n.read ? "transparent" : "rgba(20,184,166,0.04)",
                      border: "none", cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(20,184,166,0.04)")}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(0,0,0,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {notifIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.82rem", fontWeight: n.read ? 500 : 700, color: "#0f172a", lineHeight: 1.4 }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", flexShrink: 0, marginTop: 4 }} />
                        )}
                      </div>
                      <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.72rem", color: "rgba(0,0,0,0.5)", marginTop: 2, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {n.body}
                      </div>
                      <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.58rem", color: "rgba(0,0,0,0.35)", marginTop: 3 }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.75rem 16px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>
              <Link
                href="/notifications"
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
                View All Notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
