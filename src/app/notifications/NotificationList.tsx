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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {notifs.map((n) => {
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
                color: "var(--foreground)",
                letterSpacing: "0.06em",
                marginTop: "0.5rem",
              }}>
                {new Date(n.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
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
  );
}
