import Link from "next/link";
import { auth } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav>
      <Link href="/" className="nav-logo">CREWBOARD</Link>

      <ul className="nav-links">
        <li><Link href="/whitepaper">Whitepaper</Link></li>
        <li><Link href="/whitepaper#challenge">Challenge</Link></li>
        <li><Link href="/whitepaper#solution">Solution</Link></li>
        <li><Link href="/whitepaper#roadmap">Roadmap</Link></li>
        <li><Link href="/whitepaper#invest">Invest</Link></li>
      </ul>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {user && (
          <>
            <Link href="/messages" aria-label="Messages" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 8,
              color: "rgba(0,0,0,0.45)",
              transition: "color 0.2s, background 0.2s",
              textDecoration: "none",
            }}
            className="nav-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </Link>
            <Link href="/notifications" aria-label="Notifications" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 8, position: "relative",
              color: "rgba(0,0,0,0.45)",
              transition: "color 0.2s, background 0.2s",
              textDecoration: "none",
            }}
            className="nav-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {/* unread dot */}
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 6, height: 6, borderRadius: "50%",
                background: "#14b8a6",
                border: "1.5px solid #fff",
              }} />
            </Link>
          </>
        )}
        {user ? (
          <Link href="/dashboard" className="nav-pill">Dashboard</Link>
        ) : (
          <Link href="/login" className="nav-pill">Login</Link>
        )}
      </div>
    </nav>
  );
}