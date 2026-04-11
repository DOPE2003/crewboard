import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConversationListUI, { ConvItem } from "./ConversationListUI";
import { cleanupEmptyConversations } from "@/actions/messages";

export default async function MessagesPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  // Fire-and-forget: prune empty conversations this user created
  cleanupEmptyConversations().catch(() => {});

  // Only show conversations that have at least one message
  const conversations = await db.conversation.findMany({
    where: { participants: { has: userId }, messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const otherIds = conversations.map((c) => c.participants.find((p) => p !== userId) ?? "").filter(Boolean);

  // Fetch order context — most recent non-cancelled order per pair
  const userOrders = await db.order.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      status: { not: "cancelled" },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, buyerId: true, sellerId: true, amount: true, status: true,
      gig: { select: { title: true } },
    },
  }).catch(() => [] as any[]);

  // Map: partnerId → order context
  const orderByPartner: Record<string, { id: string; amount: number; gigTitle: string; status: string }> = {};
  for (const o of userOrders) {
    const partnerId = o.buyerId === userId ? o.sellerId : o.buyerId;
    if (!orderByPartner[partnerId]) {
      orderByPartner[partnerId] = { id: o.id, amount: o.amount, gigTitle: o.gig?.title ?? "", status: o.status };
    }
  }

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

  const items: ConvItem[] = conversations.map((c, i) => {
    const otherId = c.participants.find((p) => p !== userId) ?? "";
    const user = userMap[otherId] ?? null;
    const lastMsg = c.messages[0];
    const order = orderByPartner[otherId];
    return {
      id: c.id,
      updatedAt: c.updatedAt.toISOString(),
      lastMessage: lastMsg?.body ?? null,
      lastSenderId: lastMsg?.senderId ?? null,
      unread: unreadCounts[i],
      gigTitle: order?.gigTitle ?? null,
      orderId: order?.id ?? null,
      orderAmount: order?.amount ?? null,
      orderStatus: order?.status ?? null,
      user: user
        ? { id: user.id, name: user.name, twitterHandle: user.twitterHandle, image: user.image, lastSeenAt: user.lastSeenAt?.toISOString() ?? null }
        : null,
    };
  });

  return (
    <main className="page">
      <div className="msgs-shell">
        {/* Left sidebar */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: "1px solid var(--card-border)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "var(--dropdown-bg)",
        }}>
          <ConversationListUI
            items={items}
            currentUserId={userId}
            emptyContent={
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0.5rem" }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>
                  No messages yet. Start a conversation from a freelancer profile or send your first offer.
                </p>
                <Link
                  href="/talent"
                  style={{ marginTop: "0.25rem", fontSize: "0.8rem", fontWeight: 700, padding: "7px 18px", borderRadius: 8, background: "#14B8A6", color: "#fff", textDecoration: "none" }}
                >
                  Browse Talent
                </Link>
              </div>
            }
          />
        </div>

        {/* Right: empty state */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "2rem" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(20,184,166,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, flexShrink: 0,
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", margin: "0 0 8px" }}>
            Your Messages
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 20px", textAlign: "center", maxWidth: 280, lineHeight: 1.65 }}>
            No messages yet. Start a conversation from a freelancer profile or send your first offer.
          </p>
          <Link
            href="/talent"
            style={{ fontSize: "13px", fontWeight: 700, padding: "9px 22px", borderRadius: 10, background: "#14B8A6", color: "#fff", textDecoration: "none" }}
          >
            Browse Talent
          </Link>
        </div>
      </div>
    </main>
  );
}
