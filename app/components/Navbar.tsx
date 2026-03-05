import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import db from "@/lib/db";
import NavSearch from "./NavSearch";
import NavMobileMenu from "./NavMobileMenu";
import NavProfileMenu from "./NavProfileMenu";


export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // Fetch role + availability for the profile popup + unread notification count
  let dbUser: { role: string | null; availability: string | null } | null = null;
  let unreadCount = 0;
  const userId = (user as any)?.userId as string | undefined;
  if (userId) {
    [dbUser, unreadCount] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { role: true, availability: true },
      }),
      db.notification.count({ where: { userId, read: false } }),
    ]);
  }

  return (
    <nav style={{ flexDirection: "column", padding: 0, height: "auto" }}>

      {/* ── ROW 1 ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.9rem 2.5rem",
        width: "100%",
        gap: "1.5rem",
      }}>

        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
          <Image src="/logo.png" alt="Crewboard" width={60} height={60} style={{ objectFit: "contain" }} priority />
        </Link>

        {/* Center links */}
        <ul className="nav-links" style={{ margin: 0 }}>
          <li><Link href="/talent">Find Talent</Link></li>
          <li><Link href="/projects">Browse Projects</Link></li>
          <li><Link href="/jobs">Jobs</Link></li>
          <li><Link href="/daos">DAOs</Link></li>
          <li><Link href="/leaderboard">Leaderboard</Link></li>
          <li><Link href="/whitepaper">Whitepaper</Link></li>
        </ul>

        {/* Right: search + icons + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>

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

    </nav>
  );
}
