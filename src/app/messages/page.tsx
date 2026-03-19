import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

function lastSeenLabel(d: Date | null): string {
  if (!d) return "Offline";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 3 * 60) return "Active now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function MessagesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const conversations = await db.conversation.findMany({
    where: { participants: { has: userId } },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Fetch the other participant's profile for each conversation
  const otherIds = conversations.map((c) =>
    c.participants.find((p) => p !== userId) ?? ""
  );

  const otherUsers = await db.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, twitterHandle: true, image: true, role: true, lastSeenAt: true },
  });

  const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]));

  // Count unread per conversation
  const unreadCounts = await Promise.all(
    conversations.map((c) =>
      db.message.count({
        where: { conversationId: c.id, read: false, senderId: { not: userId } },
      })
    )
  );

  return (
    <main className="page">
      <div className="msgs-shell">
        <div className="msgs-sidebar">
          <div className="msgs-sidebar-header">
            <span className="msgs-title">Messages</span>
          </div>

          {conversations.length === 0 && (
            <div className="msgs-empty">
              <p>No conversations yet.</p>
              <p>Visit a builder&apos;s profile and send them a message.</p>
              <Link href="/talent" className="btn-primary" style={{ marginTop: "1rem", fontSize: "0.82rem", padding: "0.7rem 1.5rem" }}>
                Browse Talent
              </Link>
            </div>
          )}

          {conversations.map((c, i) => {
            const otherId = c.participants.find((p) => p !== userId) ?? "";
            const other = userMap[otherId];
            const lastMsg = c.messages[0];
            const unread = unreadCounts[i];

            const online = other?.lastSeenAt && (Date.now() - other.lastSeenAt.getTime()) < 3 * 60 * 1000;
            const seenLabel = lastSeenLabel(other?.lastSeenAt ?? null);

            return (
              <Link key={c.id} href={`/messages/${c.id}`} className="msgs-conv-row">
                <div className="msgs-conv-avatar" style={{ position: "relative" }}>
                  {other?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.image} alt="" />
                  ) : (
                    <div className="msgs-conv-avatar-fallback" />
                  )}
                  <span style={{
                    position: "absolute", bottom: 1, right: 1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: online ? "#22c55e" : "var(--card-border)",
                    border: "2px solid var(--dropdown-bg)",
                  }} />
                </div>
                <div className="msgs-conv-info">
                  <div className="msgs-conv-name">
                    {other?.name ?? other?.twitterHandle ?? "Unknown"}
                    {unread > 0 && (
                      <span className="msgs-unread-dot">{unread}</span>
                    )}
                  </div>
                  <div className="msgs-conv-preview">
                    {lastMsg
                      ? (() => {
                          const prefix = lastMsg.senderId === userId ? "You: " : "";
                          if (lastMsg.body.startsWith("__GIGREQUEST__:")) {
                            try {
                              const gig = JSON.parse(lastMsg.body.slice("__GIGREQUEST__:".length));
                              return prefix + `Gig Request: ${gig.title}`;
                            } catch { return prefix + "Gig Request"; }
                          }
                          return prefix + lastMsg.body.slice(0, 48) + (lastMsg.body.length > 48 ? "…" : "");
                        })()
                      : "No messages yet"}
                  </div>
                  <div style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.55rem",
                    color: online ? "#22c55e" : "rgba(0,0,0,0.35)",
                    marginTop: 2,
                  }}>
                    {seenLabel}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="msgs-empty-panel">
          <div className="msgs-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="msgs-empty-hint">Select a conversation</p>
        </div>
      </div>
    </main>
  );
}
