import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarkAllRead from "./MarkAllRead";
import AutoMarkRead from "./AutoMarkRead";
import T from "@/components/ui/T";

export const metadata = { title: "Notifications — Crewboard" };

const TYPE_ICON: Record<string, string> = {
  welcome:       "👋",
  signin:        "✦",
  system:        "🔔",
  message:       "💬",
  profile_view:  "👁",
  project_apply: "📋",
  project_invite:"🚀",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const notifications = await db.notification.findMany({
    where: { userId: session.user.userId },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="page notif-page" style={{ minHeight: "100vh" }}>
      {/* Silently marks all unread as read after page renders */}
      {unreadCount > 0 && <AutoMarkRead userId={session.user.userId} />}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "0.4rem",
            }}>
              <T k="notif.inbox" />
            </div>
            <h1 style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              color: "var(--foreground)",
              lineHeight: 1,
            }}>
              <T k="notif.title" />
              {unreadCount > 0 && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: "0.65rem",
                  background: "#2DD4BF",
                  color: "var(--foreground)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  verticalAlign: "middle",
                }}>
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <MarkAllRead userId={session.user.userId} />
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            color: "var(--text-muted)",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
          }}>
            <T k="notif.empty" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {notifications.map((n) => {
              const inner = (
                <>
                  {/* Unread dot */}
                  {!n.read && (
                    <span style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#2DD4BF",
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    fontSize: "1.3rem",
                    lineHeight: 1,
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                    <p style={{
                      fontSize: "0.85rem",
                      color: "var(--foreground)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}>
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
                <Link key={n.id} href={n.link} className={`notif-card${n.read ? "" : " notif-card--unread"}`} style={{ ...cardStyle, cursor: "pointer" }}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id} className={`notif-card${n.read ? "" : " notif-card--unread"}`} style={cardStyle}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--card-border)" }}>
          <Link href="/dashboard" style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--foreground)",
            textDecoration: "none",
          }}>
            <T k="notif.back" />
          </Link>
        </div>

      </div>
    </main>
  );
}
