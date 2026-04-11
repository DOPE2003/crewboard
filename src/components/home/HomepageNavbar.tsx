"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomepageNavbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTo(id: string) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        height: 64,
        background: scrolled ? "rgba(var(--nav-bg-rgb,255,255,255),0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--card-border)" : "1px solid transparent",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
        transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 clamp(1rem,3vw,2rem)",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <svg viewBox="0 0 48 48" style={{ width: 32, height: 32, flexShrink: 0 }}>
              <polygon points="44,24 34,6.7 14,6.7 4,24 14,41.3 34,41.3" fill="none" stroke="var(--text-1)" strokeWidth="2.5" strokeLinejoin="round"/>
              <line x1="24" y1="13" x2="14.5" y2="29.5" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="24" y1="13" x2="33.5" y2="29.5" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="14.5" y1="29.5" x2="33.5" y2="29.5" stroke="var(--text-1)" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="24" cy="13" r="3.8" fill="var(--text-1)"/>
              <circle cx="14.5" cy="29.5" r="3.8" fill="var(--text-1)"/>
              <circle cx="33.5" cy="29.5" r="3.8" fill="var(--text-1)"/>
            </svg>
            <span style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}>
              <span style={{ color: "var(--text-1)", fontWeight: 300 }}>crew</span>
              <span style={{ color: "var(--text-1)", fontWeight: 700 }}>board</span>
            </span>
          </Link>

          {/* Center links — desktop */}
          <div className="hp-nav-center">
            {[
              { label: "Browse Talent", id: "browse" },
              { label: "How It Works", id: "how-it-works" },
              { label: "Categories",   id: "categories" },
            ].map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0.45rem 0.9rem", borderRadius: 8,
                fontSize: "0.875rem", fontWeight: 500,
                color: "var(--text-muted)",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--foreground)"; (e.currentTarget as HTMLElement).style.background = "rgba(var(--foreground-rgb,0,0,0),0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right — desktop */}
          <div className="hp-nav-right">
            {isLoggedIn ? (
              <Link href="/dashboard" style={btnOutline}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login"    style={btnOutline}>Login</Link>
                <Link href="/register" style={btnPrimary}>Join</Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="hp-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "var(--text-1)", display: "none" }}
          >
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg>
            }
          </button>

        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, zIndex: 199,
          background: "var(--card-bg)",
          borderBottom: "1px solid var(--card-border)",
          padding: "0.75rem clamp(1rem,3vw,2rem) 1rem",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {[
            { label: "Browse Talent", id: "browse" },
            { label: "How It Works",  id: "how-it-works" },
            { label: "Categories",    id: "categories" },
          ].map(({ label, id }) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "0.7rem 0.5rem", textAlign: "left",
              fontSize: "0.95rem", fontWeight: 500, color: "var(--text-muted)",
              borderRadius: 8,
            }}>
              {label}
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--card-border)", marginTop: 4, paddingTop: 12, display: "flex", gap: 8 }}>
            {isLoggedIn ? (
              <Link href="/dashboard" style={{ ...btnPrimary, flex: 1, textAlign: "center" }}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login"    style={{ ...btnOutline, flex: 1, textAlign: "center" }}>Login</Link>
                <Link href="/register" style={{ ...btnPrimary, flex: 1, textAlign: "center" }}>Join</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .hp-nav-center { display: flex; align-items: center; gap: 2px; }
        .hp-nav-right  { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        @media (max-width: 640px) {
          .hp-nav-center  { display: none !important; }
          .hp-nav-right   { display: none !important; }
          .hp-hamburger   { display: flex !important; }
        }
      `}</style>
    </>
  );
}

const btnOutline: React.CSSProperties = {
  padding: "0.45rem 1.1rem",
  borderRadius: 9,
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "var(--foreground)",
  textDecoration: "none",
  border: "1px solid var(--card-border)",
  background: "transparent",
  whiteSpace: "nowrap",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.45rem 1.1rem",
  borderRadius: 9,
  fontSize: "0.875rem",
  fontWeight: 700,
  color: "#0f172a",
  textDecoration: "none",
  background: "#14b8a6",
  whiteSpace: "nowrap",
};
