"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteNotification } from "@/actions/notifications";

const TYPE_ICON: Record<string, string> = {
  welcome:        "👋",
  signin:         "✦",
  system:         "🔔",
  message:        "💬",
  profile_view:   "👁",
  project_apply:  "📋",
  project_invite: "🚀",
  order:          "📦",
  payment:        "💳",
  review:         "⭐",
  dispute:        "⚠️",
};

const TYPE_PRIORITY: Record<string, number> = {
  dispute:        6,
  order:          5,
  payment:        5,
  review:         4,
  project_apply:  3,
  project_invite: 3,
  message:        2,
  system:         1,
  profile_view:   1,
  welcome:        0,
  signin:         0,
};

export type NotifItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

function getTimeGroup(dateStr: string): "Today" | "This Week" | "Earlier" {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  if (date >= todayStart) return "Today";
  if (date >= weekStart) return "This Week";
  return "Earlier";
}

function sortNotifs(notifs: NotifItem[]): NotifItem[] {
  return [...notifs].sort((a, b) => {
    // Unread first
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    // Within same read-state: higher priority first
    const pa = TYPE_PRIORITY[a.type] ?? 0;
    const pb = TYPE_PRIORITY[b.type] ?? 0;
    if (pa !== pb) return pb - pa;
    // Same priority: newer first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function NotificationList({
  initialNotifs,
  emptyLabel,
}: {
  initialNotifs: NotifItem[];
  emptyLabel?: string;
}) {
  const [notifs, setNotifs] = useState(initialNotifs);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    startTransition(() => {
      deleteNotification(id);
    });
  }

  if (notifs.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "4rem 2rem",
        color: "var(--text-muted)",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.75rem",
        letterSpacing: "0.08em",
      }}>
        {emptyLabel ?? "No notifications yet."}
      </div>
    );
  }

  const sorted = sortNotifs(notifs);

  // Group into time buckets preserving sort order
  const groups: { label: string; items: NotifItem[] }[] = [];
  const groupMap: Record<string, NotifItem[]> = {};
  const groupOrder: string[] = [];

  for (const n of sorted) {
    const g = getTimeGroup(n.createdAt);
    if (!groupMap[g]) {
      groupMap[g] = [];
      groupOrder.push(g);
    }
    groupMap[g].push(n);
  }
  for (const label of groupOrder) {
    groups.push({ label, items: groupMap[label] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {groups.map(({ label, items }) => (
        <div key={label}>
          <div style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginBottom: "0.75rem",
            paddingLeft: "0.25rem",
          }}>
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {items.map((n) => {
              const inner = (
                <>
                  {/* Unread dot */}
                  {!n.read && (
                    <span style={{
                      position: "absolute",
                      top: 14,
                      right: 44,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#2DD4BF",
                    }} />
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "rgba(127,127,127,0.12)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "1.1rem",
                      lineHeight: 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>

                  {/* Icon */}
                  <div style={{ fontSize: "1.3rem", lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: "2rem" }}>
                    <div style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--foreground)",
                      marginBottom: "0.25rem",
                      letterSpacing: "0.02em",
                    }}>
                      {n.title}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--foreground)", lineHeight: 1.6, margin: 0 }}>
                      {n.body}
                    </p>
                    <div style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.58rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.06em",
                      marginTop: "0.5rem",
                    }}>
                      {new Date(n.createdAt).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </div>
                    {n.link && (
                      <div style={{
                        marginTop: "0.4rem",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#2DD4BF",
                      }}>
                        Open →
                      </div>
                    )}
                  </div>
                </>
              );

              const cardStyle: React.CSSProperties = {
                display: "flex",
                gap: "1rem",
                padding: "1.1rem 1.25rem",
                borderRadius: 14,
                border: "1px solid var(--card-border)",
                background: n.read ? "transparent" : "rgba(45,212,191,0.05)",
                position: "relative",
                transition: "background 0.2s",
                textDecoration: "none",
                color: "inherit",
              };

              return n.link ? (
                <Link
                  key={n.id}
                  href={n.link}
                  className={`notif-card${n.read ? "" : " notif-card--unread"}`}
                  style={{ ...cardStyle, cursor: "pointer" }}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={n.id}
                  className={`notif-card${n.read ? "" : " notif-card--unread"}`}
                  style={cardStyle}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
