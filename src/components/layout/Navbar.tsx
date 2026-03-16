import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import NavSearch from "./NavSearch";
import NavMobileMenu from "./NavMobileMenu";
import NavProfileMenu from "./NavProfileMenu";
import NavMessagesDropdown from "./NavMessagesDropdown";
import NavNotificationsDropdown from "./NavNotificationsDropdown";
import NavOrdersDropdown from "./NavOrdersDropdown";
import NavCategoryGroup from "./NavCategoryGroup";
import type { NavNotif } from "./NavNotificationsDropdown";
import type { NavOrder } from "./NavOrdersDropdown";
import T from "@/components/ui/T";


export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // Fetch role + availability for the profile popup + unread notification count + gig count
  let dbUser: { role: string | null; availability: string | null } | null = null;
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
      const [dbUserRes, notifCount, gigCount, convs, recentNotifs] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { role: true, availability: true },
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
      ]);
      dbUser = dbUserRes;
      navNotifications = recentNotifs.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }));
      unreadCount = notifCount;
      gigsCount = gigCount;

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
    <nav style={{ flexDirection: "column", padding: 0, height: "auto" }}>

      {/* ── ROW 1: Logo + Search/Icons ── */}
      <div className="nav-row1" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        gap: "1rem",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>

        {/* Logo + brand name */}
        <Link href="/" style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", textDecoration: "none", gap: "0.15rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" className="nav-logo-svg" style={{ width: 280, height: 70 }}>
            <polygon points="124,80 98,125 46,125 20,80 46,35 98,35"
              fill="none" stroke="currentColor" strokeWidth="4.4" strokeLinejoin="round"/>
            <line x1="72" y1="54" x2="52" y2="94" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
            <line x1="72" y1="54" x2="92" y2="94" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
            <line x1="52" y1="94" x2="92" y2="94" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
            <circle cx="72" cy="54" r="6.4" fill="currentColor"/>
            <circle cx="52" cy="94" r="6.4" fill="currentColor"/>
            <circle cx="92" cy="94" r="6.4" fill="currentColor"/>
            <text x="152" y="102" fill="currentColor"
              style={{ fontFamily: "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: 68, letterSpacing: -2.4 }}>
              <tspan fontWeight="300">crew</tspan><tspan fontWeight="600">board</tspan>
            </text>
          </svg>
          <span className="nav-tagline" style={{ paddingLeft: "0.3rem" }}><T k="nav.tagline" /></span>
        </Link>

        {/* Right: search + icons + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0, marginLeft: "auto" }}>

          {/* Search — hidden on mobile */}
          <div className="nav-search-wrap">
            <NavSearch />
          </div>

          {/* Icons — logged in only */}
          {user && (
            <>
              <NavMessagesDropdown conversations={navConversations} totalUnread={totalMsgUnread} />

              <NavNotificationsDropdown notifications={navNotifications} unreadCount={unreadCount} />

              {/* Orders dropdown */}
              <NavOrdersDropdown orders={navOrders} activeCount={activeOrderCount} />

              {/* Profile avatar with dropdown */}
              <NavProfileMenu
                image={user.image ?? null}
                name={user.name ?? null}
                twitterHandle={(user as any).twitterHandle ?? null}
                role={dbUser?.role ?? null}
                availability={dbUser?.availability ?? null}
                unreadCount={unreadCount}
                gigsCount={gigsCount}
              />
            </>
          )}

          {!user && (
            <Link href="/login" className="nav-pill"><T k="nav.login" /></Link>
          )}

          {/* Hamburger — mobile only */}
          <NavMobileMenu />
        </div>
      </div>

      {/* ── ROW 2: Category groups (desktop only) ── */}
      <div className="nav-links-row">
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
              { label: "Web3 Designer",   href: "/talent?role=Web3+Web+Designer" },
              { label: "Graphic & Design", href: "/talent?role=Graphic+%26+Design" },
              { label: "Content Creator",  href: "/talent?role=Content+Creator" },
            ]}
          />
          <NavCategoryGroup
            label="Marketing"
            color="#14b8a6"
            items={[
              { label: "Social Marketing",    href: "/talent?role=Social+Marketing" },
              { label: "KOL Manager",         href: "/talent?role=KOL+Manager" },
              { label: "Exchange Listings",   href: "/talent?role=Exchange+Listings+Manager" },
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

    </nav>
  );
}
