import { auth } from "@/auth";
import db from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import MessageThread from "./MessageThread";
import ChatActions from "./ChatActions";
import { WalletVerifiedBadge, HumanVerifiedBadge } from "@/components/ui/VerificationBadges";
import ConversationListUI, { ConvItem } from "../ConversationListUI";
import ProfileBottomSheet, { ProfileSidebarDesktop, ProfileData } from "./ProfileBottomSheet";
import AvatarWithFallback from "@/components/ui/AvatarWithFallback";

function lastSeenLabel(d: Date | null): string {
  if (!d) return "Offline";
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 3 * 60) return "Active now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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

  // Fetch other user + their gigs
  const other = otherId
    ? await db.user.findUnique({
        where: { id: otherId },
        select: {
          id: true,
          name: true,
          twitterHandle: true,
          image: true,
          userTitle: true,
          lastSeenAt: true,
          bio: true,
          skills: true,
          availability: true,
          walletAddress: true,
          isOG: true,
          humanVerified: true,
          worldIdLevel: true,
          gigs: {
            where: { status: "active" },
            take: 3,
            select: { id: true, title: true, price: true, deliveryDays: true },
          },
        },
      })
    : null;

  // Stats queries
  const [completedGigsCount, reviewAgg] = await Promise.all([
    db.order.count({ where: { sellerId: otherId, status: "completed" } }),
    db.review.aggregate({
      where: { revieweeId: otherId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const avgDelivery =
    other?.gigs && other.gigs.length > 0
      ? Math.round(other.gigs.reduce((a, g) => a + g.deliveryDays, 0) / other.gigs.length)
      : null;

  // Active order between these two users (for chat actions)
  const activeOrder = otherId
    ? await db.order.findFirst({
        where: {
          OR: [
            { buyerId: userId, sellerId: otherId },
            { buyerId: otherId, sellerId: userId },
          ],
          status: { not: "cancelled" },
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true, status: true, amount: true, gig: { select: { id: true, title: true } } },
      }).catch(() => null)
    : null;

  // Sidebar conversations — only those with messages
  const conversations = await db.conversation.findMany({
    where: { participants: { has: userId }, messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const otherIds = conversations
    .map((c) => c.participants.find((p) => p !== userId) ?? "")
    .filter(Boolean);

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

  // Order context for sidebar items
  const userOrders = await db.order.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: { not: "cancelled" } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, buyerId: true, sellerId: true, amount: true, status: true, gig: { select: { title: true } } },
  }).catch(() => [] as any[]);
  const orderByPartner: Record<string, { id: string; amount: number; gigTitle: string; status: string }> = {};
  for (const o of userOrders) {
    const partnerId = o.buyerId === userId ? o.sellerId : o.buyerId;
    if (!orderByPartner[partnerId]) {
      orderByPartner[partnerId] = { id: o.id, amount: o.amount, gigTitle: o.gig?.title ?? "", status: o.status };
    }
  }

  const convItems: ConvItem[] = conversations.map((c, i) => {
    const oid = c.participants.find((p) => p !== userId) ?? "";
    const u = userMap[oid] ?? null;
    const lastMsg = c.messages[0];
    const order = orderByPartner[oid];
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
      user: u
        ? { id: u.id, name: u.name, twitterHandle: u.twitterHandle, image: u.image, lastSeenAt: u.lastSeenAt?.toISOString() ?? null }
        : null,
    };
  });

  // Initial messages
  const initialMessages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, senderId: true, body: true, createdAt: true, read: true,
      replyTo: { select: { id: true, senderId: true, body: true } },
    },
  });

  const isOtherOnline = other?.lastSeenAt
    ? (Date.now() - other.lastSeenAt.getTime()) < 3 * 60 * 1000
    : false;
  const otherSeenLabel = lastSeenLabel(other?.lastSeenAt ?? null);

  // Serialize profile data for client components
  const profileData: ProfileData = {
    name: other?.name ?? null,
    twitterHandle: other?.twitterHandle ?? "",
    image: other?.image ?? null,
    role: (other as any)?.userTitle ?? null,
    bio: other?.bio ?? null,
    skills: other?.skills ?? [],
    isOG: other?.isOG ?? false,
    completedGigs: completedGigsCount,
    avgRating: reviewAgg._avg.rating ?? null,
    reviewCount: reviewAgg._count.rating,
    avgDelivery,
    gigs: (other?.gigs ?? []).map((g) => ({ id: g.id, title: g.title, price: g.price })),
  };

  return (
    <main className="page">
      <div className="msgs-shell">

        {/* LEFT: Conversations sidebar */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: "1px solid var(--card-border)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          background: "var(--dropdown-bg)",
        }} className="msgs-sidebar">
          <ConversationListUI
            items={convItems}
            activeId={id}
            currentUserId={userId}
          />
        </div>

        {/* MIDDLE: Thread panel */}
        <div className="msgs-thread-panel">
          {/* Thread header */}
          <div className="msgs-thread-header">
            <Link href="/messages" className="msgs-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </Link>

            {other && (
              <Link
                href={`/u/${other.twitterHandle}`}
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}
              >
                <div style={{ position: "relative", flexShrink: 0, width: 44, height: 44 }}>
                  <AvatarWithFallback
                    src={other.image}
                    name={other.name ?? other.twitterHandle}
                    size={44}
                  />
                  <span style={{
                    position: "absolute", bottom: 1, right: 1,
                    width: 11, height: 11, borderRadius: "50%",
                    background: isOtherOnline ? "#22c55e" : "var(--card-border)",
                    border: "2px solid var(--dropdown-bg)",
                    zIndex: 2,
                  }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="msgs-thread-name">
                    {other.name ?? other.twitterHandle ?? "Unknown"}
                  </div>
                  <div className="msgs-thread-role" style={{ color: isOtherOnline ? "#22c55e" : "var(--text-muted)" }}>
                    {otherSeenLabel}
                  </div>
                </div>
              </Link>
            )}

            {/* Chat action buttons */}
            <div style={{ display: "flex", gap: "0.4rem", marginLeft: "auto", flexShrink: 0, alignItems: "center" }}>
              {other?.walletAddress && <WalletVerifiedBadge />}
              {other?.humanVerified && <HumanVerifiedBadge level={other.worldIdLevel} />}

              {other && (
                <ChatActions
                  conversationId={id}
                  receiverId={otherId}
                  receiverName={other.name ?? other.twitterHandle ?? "them"}
                  activeOrderId={activeOrder?.id ?? null}
                />
              )}
            </div>

            {/* Mobile: View Profile button (opens bottom sheet) */}
            <ProfileBottomSheet profile={profileData} />
          </div>

          <MessageThread
            conversationId={id}
            currentUserId={userId}
            otherUserHandle={other?.twitterHandle ?? ""}
            otherUserName={other?.name ?? null}
            initialMessages={JSON.parse(JSON.stringify(initialMessages))}
          />
        </div>

        {/* RIGHT: Profile sidebar (desktop only) */}
        <ProfileSidebarDesktop profile={profileData} />
      </div>
    </main>
  );
}
