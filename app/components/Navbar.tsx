import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import NavSearch from "./NavSearch";

const CATEGORIES = [
  { label: "Smart Contracts", href: "/talent?category=smart-contracts" },
  { label: "DeFi & Protocol",  href: "/talent?category=defi" },
  { label: "NFT & Gaming",     href: "/talent?category=nft" },
  { label: "Frontend",         href: "/talent?category=frontend" },
  { label: "Design & UI",      href: "/talent?category=design" },
  { label: "Community",        href: "/talent?category=community" },
  { label: "Marketing",        href: "/talent?category=marketing" },
  { label: "Research",         href: "/talent?category=research" },
];

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

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
          <Image src="/logo.png" alt="Crewboard" width={120} height={40} style={{ objectFit: "contain" }} priority />
        </Link>

        {/* Center links */}
        <ul className="nav-links" style={{ margin: 0 }}>
          <li><Link href="/talent">Find Talent</Link></li>
          <li><Link href="/projects">Browse Projects</Link></li>
          <li><Link href="/whitepaper">Whitepaper</Link></li>
        </ul>

        {/* Right: search + icons + auth */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>

          {/* Search */}
          <NavSearch />

          {/* Icons — logged in only */}
          {user && (
            <>
              <Link href="/messages" aria-label="Messages" className="nav-icon-btn" style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 8,
                color: "rgba(255,255,255,0.55)",
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
                color: "rgba(255,255,255,0.55)",
                transition: "color 0.2s, background 0.2s",
                textDecoration: "none",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
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
      </div>

      {/* ── ROW 2 — Categories ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "0 2.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {CATEGORIES.map((cat) => (
          <Link key={cat.label} href={cat.href} style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 600,
            fontSize: "0.78rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#fff",
            textDecoration: "none",
            padding: "0.55rem 0.85rem",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            transition: "color 0.15s, background 0.15s",
          }}>
            {cat.label}
          </Link>
        ))}
      </div>

    </nav>
  );
}
