import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import MessageThread from "./MessageThread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const { id } = await params;

  const conv = await db.conversation.findUnique({
    where: { id },
    select: { participants: true },
  });

  if (!conv || !conv.participants.includes(userId)) notFound();

  const otherId = conv.participants.find((p) => p !== userId) ?? "";
  const other = otherId
    ? await db.user.findUnique({
        where: { id: otherId },
        select: { name: true, twitterHandle: true, image: true, role: true },
      })
    : null;

  // Sidebar conversations for split view
  const conversations = await db.conversation.findMany({
    where: { participants: { has: userId } },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const otherIds = conversations.map((c) =>
    c.participants.find((p) => p !== userId) ?? ""
  );
  const sidebarUsers = await db.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, twitterHandle: true, image: true },
  });
  const userMap = Object.fromEntries(sidebarUsers.map((u) => [u.id, u]));

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
        {/* Sidebar */}
        <div className="msgs-sidebar">
          <div className="msgs-sidebar-header">
            <span className="msgs-title">Messages</span>
          </div>

          {conversations.map((c, i) => {
            const oid = c.participants.find((p) => p !== userId) ?? "";
            const u = userMap[oid];
            const lastMsg = c.messages[0];
            const unread = unreadCounts[i];
            const active = c.id === id;

            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className={`msgs-conv-row ${active ? "active" : ""}`}
              >
                <div className="msgs-conv-avatar">
                  {u?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.image} alt="" />
                  ) : (
                    <div className="msgs-conv-avatar-fallback" />
                  )}
                </div>
                <div className="msgs-conv-info">
                  <div className="msgs-conv-name">
                    {u?.name ?? u?.twitterHandle ?? "Unknown"}
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
                </div>
              </Link>
            );
          })}
        </div>

        {/* Thread panel */}
        <div className="msgs-thread-panel">
          {/* Thread header */}
          <div className="msgs-thread-header">
            <Link href="/messages" className="msgs-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </Link>
            <div className="msgs-thread-avatar">
              {other?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={other.image} alt="" />
              ) : (
                <div className="msgs-thread-avatar-fallback" />
              )}
            </div>
            <div>
              <div className="msgs-thread-name">
                {other?.name ?? other?.twitterHandle ?? "Unknown"}
              </div>
              {other?.role && (
                <div className="msgs-thread-role">{other.role}</div>
              )}
            </div>
          </div>

          <MessageThread conversationId={id} currentUserId={userId} />
        </div>
      </div>
    </main>
  );
}
