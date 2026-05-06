import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import NavSearch from "./NavSearch";
import NavProfileMenu from "./NavProfileMenu";
import NavControlsClient from "./NavControlsClient";
import NavScrollWrapper from "./NavScrollWrapper";
import NavCategoryStrip from "./NavCategoryStrip";

import type { NavNotif, NavOrder } from "@/types/nav";

function msgPreview(body: string, maxLen = 50): string {
  if (body.startsWith("__GIGREQUEST__:")) {
    try { return "Gig Request: " + JSON.parse(body.slice("__GIGREQUEST__:".length)).title; }
    catch { return "Gig Request"; }
  }
  if (body.startsWith("__FILE__:")) {
    try {
      const f = JSON.parse(body.slice("__FILE__:".length));
      if (f.type?.startsWith("image/")) return "📷 Image";
      if (f.type?.startsWith("video/")) return "🎥 Video";
      return "📄 " + f.name;
    } catch { return "📎 File"; }
  }
  return body.slice(0, maxLen) + (body.length > maxLen ? "…" : "");
}

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // Fetch role + availability for the profile popup + unread notification count + gig count
  let dbUser: { role: string | null; availability: string | null; image: string | null; cvUrl: string | null; walletAddress: string | null; twitterId: string | null } | null = null;
  let hasIncompleteOnboarding = false;
  let unreadCount = 0;
  let gigsCount = 0;
  let navNotifications: NavNotif[] = [];
  let navConversations: Array<{
    id: string;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unread: number;
    otherUser: { id: string; name: string | null; twitterHandle: string; image: string | null; lastSeenAt: string | null } | null;
  }> = [];
  let totalMsgUnread = 0;
  let navOrders: NavOrder[] = [];
  let activeOrderCount = 0;

  const userId = (user as any)?.userId as string | undefined;
  if (userId) {
    try {
      const [dbUserRes, notifCount, gigCount, convs, recentNotifs, totalGigCount] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { role: true, availability: true, image: true, cvUrl: true, walletAddress: true, twitterId: true },
          // Cache for 60s — user profile data rarely changes mid-session
        }),
        db.notification.count({ where: { userId, read: false } }).catch(() => 0),
        db.gig.count({ where: { userId, status: "active" } }),
        db.conversation.findMany({
          where: { participants: { has: userId } },
          orderBy: { updatedAt: "desc" },
          take: 5,          // reduced from 8
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        }),
        db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,          // reduced from 10
          select: { id: true, type: true, title: true, body: true, link: true, read: true, createdAt: true },
        }).catch(() => []),
        db.gig.count({ where: { userId } }).catch(() => 0),
      ]);
      dbUser = dbUserRes;
      navNotifications = recentNotifs.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }));
      unreadCount = notifCount;
      gigsCount = gigCount;

      if (dbUser) {
        hasIncompleteOnboarding = (
          (!dbUser.twitterId && !dbUser.image) ||
          !dbUser.cvUrl ||
          !dbUser.walletAddress ||
          totalGigCount === 0
        );
      }

      // Fetch other participants' profiles
      const otherIds = convs.map((c) => c.participants.find((p) => p !== userId) ?? "").filter(Boolean);
      const otherUsers = await db.user.findMany({
        where: { id: { in: otherIds } },
        select: { id: true, name: true, twitterHandle: true, image: true, lastSeenAt: true },
      }).catch(() => []);
      const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]));

      // Unread counts per conversation — single query instead of N
      const convIds = convs.map((c) => c.id);
      const unreadGroups = convIds.length > 0
        ? await db.message.groupBy({
            by: ["conversationId"],
            where: { conversationId: { in: convIds }, read: false, senderId: { not: userId } },
            _count: { id: true },
          }).catch(() => [])
        : [];
      const unreadMap = Object.fromEntries(unreadGroups.map((g) => [g.conversationId, g._count.id]));
      const unreadPerConv = convs.map((c) => unreadMap[c.id] ?? 0);

      totalMsgUnread = unreadPerConv.reduce((a, b) => a + b, 0);

      navConversations = convs.map((c, i) => {
        const otherId = c.participants.find((p) => p !== userId) ?? "";
        const other = userMap[otherId] ?? null;
        const lastMsg = c.messages[0];
        let lastMessageText: string | null = null;
        if (lastMsg) {
          const prefix = lastMsg.senderId === userId ? "You: " : "";
          lastMessageText = prefix + msgPreview(lastMsg.body, 50);
        }
        return {
          id: c.id,
          lastMessage: lastMessageText,
          lastSenderId: lastMsg?.senderId ?? null,
          lastMessageTime: lastMsg?.createdAt?.toISOString() ?? null,
          unread: unreadPerConv[i],
          otherUser: other
            ? {
                id: other.id,
                name: other.name,
                twitterHandle: other.twitterHandle,
                image: other.image,
                lastSeenAt: (other as any).lastSeenAt?.toISOString?.() ?? null,
              }
            : null,
        };
      });
      // Fetch recent orders for dropdown
      const recentOrders = await db.order.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          gig: { select: { id: true, title: true, category: true } },
          buyer: { select: { id: true, name: true, twitterHandle: true, image: true } },
          seller: { select: { id: true, name: true, twitterHandle: true, image: true } },
        },
      }).catch(() => []);

      navOrders = recentOrders.map((o) => {
        const role: "buyer" | "seller" = o.buyerId === userId ? "buyer" : "seller";
        const other = role === "buyer" ? o.seller : o.buyer;
        return {
          id: o.id,
          status: o.status,
          amount: o.amount,
          createdAt: o.createdAt.toISOString(),
          gigTitle: o.gig.title,
          gigCategory: o.gig.category ?? "",
          role,
          other: other
            ? { id: other.id, name: other.name, twitterHandle: other.twitterHandle, image: other.image }
            : null,
        };
      });

      activeOrderCount = recentOrders.filter((o) =>
        ["pending", "accepted", "funded", "delivered"].includes(o.status)
      ).length;

    } catch (e) {
      console.error("[Navbar] DB error:", e);
    }
  }

  return (
    <NavScrollWrapper>

      {/* ── Single row: Logo | Center links | Search | Icons ── */}
      <div className="nav-row1" style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: "12px",
      }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 no-underline">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="shrink-0" style={{ width: 36, height: 36 }}>
            <polygon points="44,24 34,6.7 14,6.7 4,24 14,41.3 34,41.3" fill="none" stroke="var(--text-1)" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Equilateral triangle — circumradius 11, centroid at hexagon center (24,24) */}
            <line x1="24" y1="13" x2="14.5" y2="29.5" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="24" y1="13" x2="33.5" y2="29.5" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round"/>
            <line x1="14.5" y1="29.5" x2="33.5" y2="29.5" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="24" cy="13" r="3.8" fill="var(--text-1)"/>
            <circle cx="14.5" cy="29.5" r="3.8" fill="var(--text-1)"/>
            <circle cx="33.5" cy="29.5" r="3.8" fill="var(--text-1)"/>
          </svg>
          <div className="flex flex-col leading-none gap-[3px]">
            <span className="nav-wordmark" style={{ lineHeight: 1 }}>
              <span style={{ color: "var(--text-1)", fontWeight: 300 }}>crew</span><span style={{ color: "var(--text-1)", fontWeight: 700 }}>board</span>
            </span>
          </div>
        </Link>

        {/* Search — stretches to fill available space */}
        <div className="hidden md:flex" style={{ flex: 1, minWidth: 0 }}>
          <NavSearch />
        </div>

        {/* Icons — far right */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "auto" }}>
          <NavControlsClient
            loggedIn={!!user}
            conversations={navConversations}
            totalUnread={totalMsgUnread}
            notifications={navNotifications}
            unreadCount={unreadCount}
            orders={navOrders}
            activeCount={activeOrderCount}
            hasIncompleteOnboarding={hasIncompleteOnboarding}
            userImage={dbUser?.image ?? user?.image ?? null}
            twitterHandle={(user as any)?.twitterHandle ?? null}
          >
            {user && (
              <NavProfileMenu
                image={dbUser?.image ?? user.image ?? null}
                name={user.name ?? null}
                twitterHandle={(user as any).twitterHandle ?? null}
                role={dbUser?.role ?? null}
                availability={dbUser?.availability ?? null}
                unreadCount={unreadCount}
                gigsCount={gigsCount}
              />
            )}
          </NavControlsClient>
        </div>

      </div>

      <NavCategoryStrip />

      <style>{`
        @keyframes tealPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(1.5); }
        }
      `}</style>

    </NavScrollWrapper>
  );
}
