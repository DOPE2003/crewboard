import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConversationListUI, { ConvItem } from "./ConversationListUI";

export default async function MessagesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

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

  const otherUsers = await db.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, twitterHandle: true, image: true, lastSeenAt: true },
  });

  const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]));

  const unreadCounts = await Promise.all(
    conversations.map((c) =>
      db.message.count({
        where: { conversationId: c.id, read: false, senderId: { not: userId } },
      })
    )
  );

  const items: ConvItem[] = conversations.map((c, i) => {
    const otherId = c.participants.find((p) => p !== userId) ?? "";
    const user = userMap[otherId] ?? null;
    const lastMsg = c.messages[0];
    return {
      id: c.id,
      updatedAt: c.updatedAt.toISOString(),
      lastMessage: lastMsg?.body ?? null,
      lastSenderId: lastMsg?.senderId ?? null,
      unread: unreadCounts[i],
      user: user
        ? {
            id: user.id,
            name: user.name,
            twitterHandle: user.twitterHandle,
            image: user.image,
            lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
          }
        : null,
    };
  });

  return (
    <main className="page">
      <div className="msgs-shell">
        <div className="msgs-sidebar">
          <ConversationListUI
            items={items}
            currentUserId={userId}
            emptyContent={
              <>
                <p>No conversations yet.</p>
                <p>Visit a builder&apos;s profile and send them a message.</p>
                <Link
                  href="/talent"
                  className="btn-primary"
                  style={{ marginTop: "1rem", fontSize: "0.82rem", padding: "0.7rem 1.5rem" }}
                >
                  Browse Talent
                </Link>
              </>
            }
          />
        </div>

        <div className="msgs-empty-panel">
          <div className="msgs-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.18 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="msgs-empty-hint">Select a conversation to start messaging</p>
        </div>
      </div>
    </main>
  );
}
