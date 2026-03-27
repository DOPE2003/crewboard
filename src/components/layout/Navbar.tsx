import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import NavSearch from "./NavSearch";
import NavProfileMenu from "./NavProfileMenu";
import NavControlsClient from "./NavControlsClient";
import NavCategoryGroup from "./NavCategoryGroup";

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

      {/* ── Single bar: Logo | Categories (center) | Search + Icons ── */}
      <div className="nav-row1" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: "1rem",
      }}>

        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, display: "flex", alignItems: "center", textDecoration: "none", gap: "0.5rem" }}>
          {/* Hex mark */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 60" style={{ width: 28, height: 32, flexShrink: 0 }}>
            <polygon points="46,30 37,46 19,46 10,30 19,14 37,14"
              fill="none" stroke="var(--text-1)" strokeWidth="3" strokeLinejoin="round"/>
            <line x1="28" y1="20" x2="18" y2="38" stroke="var(--text-1)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="28" y1="20" x2="38" y2="38" stroke="var(--text-1)" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="18" y1="38" x2="38" y2="38" stroke="var(--text-1)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="28" cy="20" r="3" fill="var(--text-1)"/>
            <circle cx="18" cy="38" r="3" fill="var(--text-1)"/>
            <circle cx="38" cy="38" r="3" fill="var(--text-1)"/>
          </svg>
          {/* Wordmark */}
          <span className="nav-wordmark">
            <span style={{ color: "var(--text-1)", fontWeight: 300 }}>crew</span><span style={{ color: "var(--text-1)", fontWeight: 700 }}>board</span>
          </span>
        </Link>

        {/* Center: category nav (desktop only) */}
        <div className="nav-cats-center hidden md:flex">
          <ul className="nav-links" style={{ margin: 0 }}>
            <NavCategoryGroup
              label="Creative"
              color="#f59e0b"
              items={[
                { label: "Video & Animation", href: "/talent?role=Video+%26+Animation" },
                { label: "Artist",            href: "/talent?role=Artist" },
              ]}
            />
            <NavCategoryGroup
              label="Design"
              color="#8b5cf6"
              items={[
                { label: "Web3 Designer",    href: "/talent?role=Web3+Web+Designer" },
                { label: "Graphic & Design", href: "/talent?role=Graphic+%26+Design" },
                { label: "Content Creator",  href: "/talent?role=Content+Creator" },
              ]}
            />
            <NavCategoryGroup
              label="Marketing"
              color="#14b8a6"
              items={[
                { label: "Social Marketing",  href: "/talent?role=Social+Marketing" },
                { label: "KOL Manager",       href: "/talent?role=KOL+Manager" },
                { label: "Exchange Listings", href: "/talent?role=Exchange+Listings+Manager" },
              ]}
            />
            <NavCategoryGroup
              label="Tech"
              color="#3b82f6"
              items={[
                { label: "Coding & Tech", href: "/talent?role=Coding+%26+Tech" },
                { label: "AI Engineer",   href: "/talent?role=AI+Engineer" },
              ]}
            />
          </ul>
        </div>

        {/* Right: search + icons + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <div className="nav-search-wrap hidden md:flex" style={{ justifyContent: "center" }}>
            <NavSearch />
          </div>
          <NavControlsClient
            loggedIn={!!user}
            conversations={navConversations}
            totalUnread={totalMsgUnread}
            notifications={navNotifications}
            unreadCount={unreadCount}
            orders={navOrders}
            activeCount={activeOrderCount}
            hasIncompleteOnboarding={hasIncompleteOnboarding}
            userImage={user?.image ?? null}
            twitterHandle={(user as any)?.twitterHandle ?? null}
          >
            {user && (
              <NavProfileMenu
                image={user.image ?? null}
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

    </nav>
  );
}
