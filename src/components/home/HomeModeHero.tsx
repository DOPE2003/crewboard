"use client";
import Link from "next/link";
import { useMode, setMode } from "@/components/ModeProvider";
import HeroSearch from "@/components/home/HeroSearch";

export default function HomeModeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { mode } = useMode();
  const isClient = mode === "hiring";

  return (
    <>
      <h1
        className="hero-h1"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          marginBottom: "1.1rem",
          color: "var(--foreground)",
          opacity: 0,
          animation: "fadeUp 0.6s 0.25s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient ? (
          <>Hire the crew<br />behind the <span style={{ color: "var(--brand)" }}>work.</span></>
        ) : (
          <>Find work that<br /><span style={{ color: "var(--brand)" }}>actually ships.</span></>
        )}
      </h1>

      <p
        className="hero-subtitle"
        style={{
          color: "var(--text-muted)",
          fontSize: "1rem",
          lineHeight: 1.6,
          maxWidth: "28rem",
          letterSpacing: "-0.01em",
          marginBottom: "2rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.42s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient
          ? "The Web3 Freelance Marketplace. Browse verified talent, lock a budget, and pay securely when the work is delivered."
          : "Browse real jobs from real productions. Get matched, get paid — secured by escrow so you never chase an invoice."}
      </p>

      {/* Mobile search */}
      <div className="flex md:hidden" style={{
        opacity: 0, animation: "fadeUp 0.6s 0.52s forwards",
        position: "relative", zIndex: 1, width: "100%",
        justifyContent: "center", marginBottom: 16,
      }}>
        <HeroSearch />
      </div>

      {/* ── CTA buttons ── */}
      {isLoggedIn ? (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          width: "100%", maxWidth: 420,
          opacity: 0, animation: "fadeUp 0.6s 0.62s forwards",
          position: "relative", zIndex: 1,
        }}>
          <Link href="/talent" className="hero-pill-btn hero-pill-teal">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Find Talent
          </Link>
          <Link href="/jobs" className="hero-pill-btn hero-pill-dark">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            Find Work
          </Link>
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          width: "100%", maxWidth: 360,
          opacity: 0, animation: "fadeUp 0.6s 0.62s forwards",
          position: "relative", zIndex: 1,
        }}>
          <Link
            href="/register"
            onClick={() => setMode("hiring")}
            className="hero-pill-btn hero-pill-teal"
          >
            Sign Up — It&apos;s Free
          </Link>
          <Link href="/login" className="hero-pill-btn hero-pill-outline">
            I already have an account
          </Link>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <Link href="/login" className="hero-pill-btn hero-pill-dark" style={{ flex: 1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Sign in with X
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
