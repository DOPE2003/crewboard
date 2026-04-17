import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import MarkAllRead from "./MarkAllRead";
import AutoMarkRead from "./AutoMarkRead";
import T from "@/components/ui/T";
import NotificationList, { NotifItem } from "./NotificationList";

export const metadata = { title: "Notifications — Crewboard" };

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
        <NotificationList
          initialNotifs={notifications.map((n): NotifItem => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            read: n.read,
            link: n.link ?? null,
            createdAt: n.createdAt.toISOString(),
          }))}
          emptyLabel="No notifications yet."
        />

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
