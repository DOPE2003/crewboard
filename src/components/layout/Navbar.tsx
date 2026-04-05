import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import NavSearch from "./NavSearch";
import NavProfileMenu from "./NavProfileMenu";
import NavControlsClient from "./NavControlsClient";

import type { NavNotif, NavOrder } from "@/types/nav";
import T from "@/components/ui/T";


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
        }),
        db.notification.count({ where: { userId, read: false } }).catch(() => 0),
        db.gig.count({ where: { userId, status: "active" } }),
        db.conversation.findMany({
          where: { participants: { has: userId } },
          orderBy: { updatedAt: "desc" },
          take: 8,
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        }),
        db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
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

      // Unread counts per conversation
      const unreadPerConv = await Promise.all(
        convs.map((c) => db.message.count({ where: { conversationId: c.id, read: false, senderId: { not: userId } } }).catch(() => 0))
      );

      totalMsgUnread = unreadPerConv.reduce((a, b) => a + b, 0);

      navConversations = convs.map((c, i) => {
        const otherId = c.participants.find((p) => p !== userId) ?? "";
        const other = userMap[otherId] ?? null;
        const lastMsg = c.messages[0];
        let lastMessageText: string | null = null;
        if (lastMsg) {
          if (lastMsg.body.startsWith("__GIGREQUEST__:")) {
            lastMessageText = (lastMsg.senderId === userId ? "You: " : "") + "Gig Request";
          } else {
            const prefix = lastMsg.senderId === userId ? "You: " : "";
            lastMessageText = prefix + lastMsg.body.slice(0, 50) + (lastMsg.body.length > 50 ? "…" : "");
          }
        }
        return {
          id: c.id,
          lastMessage: lastMessageText,
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
    <nav>

      {/* ── Single row: Logo | Categories | Search | Icons ── */}
      <div className="nav-row1" style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: "12px",
      }}>

        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, display: "flex", alignItems: "center", textDecoration: "none", gap: "0.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: 34, height: 34, flexShrink: 0 }}>
            <polygon points="44,24 34,6.7 14,6.7 4,24 14,41.3 34,41.3" fill="none" stroke="var(--text-1)" strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="24" y1="15" x2="16" y2="32" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="15" x2="32" y2="32" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="32" x2="32" y2="32" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="24" cy="15" r="3.5" fill="var(--text-1)"/>
            <circle cx="16" cy="32" r="3.5" fill="var(--text-1)"/>
            <circle cx="32" cy="32" r="3.5" fill="var(--text-1)"/>
          </svg>
          <span className="nav-wordmark">
            <span style={{ color: "var(--text-1)", fontWeight: 300 }}>crew</span><span style={{ color: "var(--text-1)", fontWeight: 700 }}>board</span>
          </span>
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

      {/* ── Category scroll row ── */}
      <div style={{
        background: "linear-gradient(90deg, #f0fdfa 0%, #ccfbf1 50%, #f0fdfa 100%)",
        borderBottom: "1px solid #99f6e4",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 24px",
          maxWidth: 1280,
          margin: "0 auto",
          width: "max-content",
          minWidth: "100%",
        }}>
          {[
            { label: "🔥 Trending",           href: "/talent" },
            { label: "💻 Coding & Tech",       href: "/talent?role=Coding+%26+Tech" },
            { label: "🤖 AI Engineer",         href: "/talent?role=AI+Engineer" },
            { label: "🎨 Graphic & Design",    href: "/talent?role=Graphic+%26+Design" },
            { label: "📹 Video & Animation",   href: "/talent?role=Video+%26+Animation" },
            { label: "📣 Social Marketing",    href: "/talent?role=Social+Marketing" },
            { label: "🎯 KOL Manager",         href: "/talent?role=KOL+Manager" },
            { label: "✍️ Content Creator",     href: "/talent?role=Content+Creator" },
            { label: "🌐 Web3 Designer",       href: "/talent?role=Web3+Web+Designer" },
            { label: "📊 Exchange Listings",   href: "/talent?role=Exchange+Listings+Manager" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="nav-cat-pill"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: "#0f766e",
                textDecoration: "none",
                whiteSpace: "nowrap",
                borderBottom: "2px solid transparent",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .nav-cat-pill:hover {
          color: #0f172a !important;
          border-bottom: 2px solid #14B8A6 !important;
          background: rgba(20,184,166,0.08) !important;
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>

    </nav>
  );
}
