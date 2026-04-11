import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AvatarWithFallback from "@/components/ui/AvatarWithFallback";
import ConversationListUI, { ConvItem } from "../ConversationListUI";
import NewConversationThread from "./NewConversationThread";

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const { with: recipientId } = await searchParams;
  if (!recipientId) redirect("/messages");

  // Don't allow messaging yourself
  if (recipientId === userId) redirect("/messages");

  // Check if a real conversation with messages already exists
  const existing = await db.conversation.findFirst({
    where: {
      AND: [
        { participants: { has: userId } },
        { participants: { has: recipientId } },
      ],
      messages: { some: {} },
    },
    select: { id: true },
  });
  if (existing) redirect(`/messages/${existing.id}`);

  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { id: true, name: true, twitterHandle: true, image: true, userTitle: true, lastSeenAt: true },
  });
  if (!recipient) notFound();

  // Sidebar conversations (with messages only)
  const conversations = await db.conversation.findMany({
    where: { participants: { has: userId }, messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const otherIds = conversations.map((c) => c.participants.find((p) => p !== userId) ?? "").filter(Boolean);
  const otherUsers = await db.user.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, twitterHandle: true, image: true, lastSeenAt: true },
  });
  const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]));
  const unreadCounts = await Promise.all(
    conversations.map((c) =>
      db.message.count({ where: { conversationId: c.id, read: false, senderId: { not: userId } } })
    )
  );

  const convItems: ConvItem[] = conversations.map((c, i) => {
    const oid = c.participants.find((p) => p !== userId) ?? "";
    const u = userMap[oid] ?? null;
    const lastMsg = c.messages[0];
    return {
      id: c.id,
      updatedAt: c.updatedAt.toISOString(),
      lastMessage: lastMsg?.body ?? null,
      lastSenderId: lastMsg?.senderId ?? null,
      unread: unreadCounts[i],
      user: u ? { id: u.id, name: u.name, twitterHandle: u.twitterHandle, image: u.image, lastSeenAt: u.lastSeenAt?.toISOString() ?? null } : null,
    };
  });

  const isOnline = recipient.lastSeenAt
    ? (Date.now() - recipient.lastSeenAt.getTime()) < 3 * 60 * 1000
    : false;

  const recipientName = recipient.name ?? `@${recipient.twitterHandle}`;

  return (
    <main className="page">
      <div className="msgs-shell">

        {/* LEFT: Conversations sidebar */}
        <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid var(--card-border)", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--dropdown-bg)" }} className="msgs-sidebar">
          <ConversationListUI items={convItems} currentUserId={userId} />
        </div>

        {/* MIDDLE: New conversation panel */}
        <div className="msgs-thread-panel">
          {/* Thread header */}
          <div className="msgs-thread-header">
            <Link href="/messages" className="msgs-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </Link>

            <Link
              href={`/u/${recipient.twitterHandle}`}
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}
            >
              <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                <AvatarWithFallback src={recipient.image} name={recipient.name ?? recipient.twitterHandle} size={44} />
                <span style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: "50%",
                  background: isOnline ? "#22c55e" : "var(--card-border)",
                  border: "2px solid var(--dropdown-bg)", zIndex: 2,
                }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="msgs-thread-name">{recipientName}</div>
                <div className="msgs-thread-role" style={{ color: isOnline ? "#22c55e" : "var(--text-muted)" }}>
                  {isOnline ? "Active now" : recipient.userTitle ?? "Crewboard member"}
                </div>
              </div>
            </Link>
          </div>

          <NewConversationThread recipientId={recipientId} recipientName={recipientName} />
        </div>
      </div>
    </main>
  );
}
