import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import NavSearch from "./NavSearch";
import NavMobileMenu from "./NavMobileMenu";
import NavProfileMenu from "./NavProfileMenu";


export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // Fetch role + availability for the profile popup + unread notification count + gig count
  let dbUser: { role: string | null; availability: string | null } | null = null;
  let unreadCount = 0;
  let gigsCount = 0;
  const userId = (user as any)?.userId as string | undefined;
  if (userId) {
    [dbUser, unreadCount, gigsCount] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { role: true, availability: true },
      }),
      db.notification.count({ where: { userId, read: false } }),
      db.gig.count({ where: { userId, status: "active" } }),
    ]);
  }

  return (
    <nav style={{ flexDirection: "column", padding: 0, height: "auto" }}>

      {/* ── ROW 1: Logo + Search/Icons ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.65rem 2.5rem",
        width: "100%",
        gap: "1rem",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>

        {/* Logo + brand name */}
        <Link href="/" style={{ flexShrink: 0, display: "flex", flexDirection: "column", textDecoration: "none", gap: 1 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" style={{ width: 210, height: 52 }}>
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
          <span className="nav-tagline">Web3 Talent Marketplace</span>
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
              <Link href="/messages" aria-label="Messages" className="nav-icon-btn" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8,
                color: "rgba(0,0,0,0.5)",
                transition: "color 0.2s, background 0.2s",
                textDecoration: "none",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </Link>
              <Link href="/notifications" aria-label="Notifications" className="nav-icon-btn" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8, position: "relative",
                color: "rgba(0,0,0,0.5)",
                transition: "color 0.2s, background 0.2s",
                textDecoration: "none",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: 4, right: 4,
                    minWidth: 15, height: 15, borderRadius: "999px",
                    background: "#14b8a6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.48rem", fontWeight: 700,
                    color: "#fff", lineHeight: 1,
                    padding: "0 3px",
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

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
            <Link href="/login" className="nav-pill">Login</Link>
          )}

          {/* Hamburger — mobile only */}
          <NavMobileMenu />
        </div>
      </div>

      {/* ── ROW 2: Category links (desktop only) ── */}
      <div className="nav-links-row">
        <ul className="nav-links" style={{ margin: 0 }}>
          <li><Link href="/talent?role=KOL+Manager">KOL Manager</Link></li>
          <li><Link href="/talent?role=Exchange+Listings+Manager">Exchange Listings</Link></li>
          <li><Link href="/talent?role=Web3+Web+Designer">Web3 Designer</Link></li>
          <li><Link href="/talent?role=Social+Marketing">Social Marketing</Link></li>
          <li><Link href="/talent?role=Artist">Artist</Link></li>
          <li><Link href="/talent?role=Video+%26+Animation">Video & Animation</Link></li>
          <li><Link href="/talent?role=Coding+%26+Tech">Coding & Tech</Link></li>
          <li><Link href="/talent?role=AI+Engineer">AI Engineer</Link></li>
          <li><Link href="/talent?role=Content+Creator">Content Creator</Link></li>
          <li><Link href="/talent?role=Graphic+%26+Design">Graphic & Design</Link></li>
          <li className="nav-link-sep" />
          <li><Link href="/whitepaper" className="nav-link-whitepaper">Whitepaper</Link></li>
        </ul>
      </div>

    </nav>
  );
}
