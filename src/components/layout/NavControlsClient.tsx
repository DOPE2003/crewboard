"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import NavMessagesDropdown from "./NavMessagesDropdown";
import NavNotificationsDropdown from "./NavNotificationsDropdown";
import NavOrdersDropdown from "./NavOrdersDropdown";
import NavMobileMenu from "./NavMobileMenu";
import type { NavNotif } from "./NavNotificationsDropdown";
import type { NavOrder } from "./NavOrdersDropdown";

type Panel = "messages" | "notifications" | "orders" | "menu" | null;

interface Conv {
  id: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unread: number;
  otherUser: { id: string; name: string | null; twitterHandle: string; image: string | null; lastSeenAt: string | null } | null;
}

interface Props {
  loggedIn: boolean;
  conversations: Conv[];
  totalUnread: number;
  notifications: NavNotif[];
  unreadCount: number;
  orders: NavOrder[];
  activeCount: number;
  hasIncompleteOnboarding: boolean;
  children: ReactNode; // NavProfileMenu or login pill — server-rendered, passed through
}

export default function NavControlsClient({
  loggedIn,
  conversations,
  totalUnread,
  notifications,
  unreadCount,
  orders,
  activeCount,
  hasIncompleteOnboarding,
  children,
}: Props) {
  // ── Single source of truth for which panel is open ──
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 767);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close all panels on route change
  useEffect(() => { setOpenPanel(null); }, [pathname]);

  // Body scroll lock — mobile only
  useEffect(() => {
    if (openPanel !== null && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openPanel, isMobile]);

  // ESC key closes any open panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPanel(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {loggedIn && (
        <>
          <NavMessagesDropdown
            conversations={conversations}
            totalUnread={totalUnread}
            isOpen={openPanel === "messages"}
            onOpen={() => setOpenPanel("messages")}
            onClose={() => setOpenPanel(null)}
          />
          <NavNotificationsDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            hasIncompleteOnboarding={hasIncompleteOnboarding}
            isOpen={openPanel === "notifications"}
            onOpen={() => setOpenPanel("notifications")}
            onClose={() => setOpenPanel(null)}
          />
          <NavOrdersDropdown
            orders={orders}
            activeCount={activeCount}
            isOpen={openPanel === "orders"}
            onOpen={() => setOpenPanel("orders")}
            onClose={() => setOpenPanel(null)}
          />
        </>
      )}

      {/* NavProfileMenu or login pill — server components passed as children */}
      {children}

      <NavMobileMenu
        isOpen={openPanel === "menu"}
        onOpen={() => setOpenPanel("menu")}
        onClose={() => setOpenPanel(null)}
      />
    </>
  );
}
