"use client";
import Link from "next/link";
import { useMode, setMode } from "@/components/ModeProvider";

export default function HomeModeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { mode } = useMode();
  const isClient = mode === "hiring";

  return (
    <>
      {/* Headline */}
      <h1
        className="hero-h1"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 1.0,
          marginBottom: "1.4rem",
          color: "var(--foreground)",
          opacity: 0,
          animation: "fadeUp 0.55s 0.2s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient ? (
          <>
            Hire the crew<br />
            behind the <span style={{ color: "var(--brand)" }}>work.</span>
          </>
        ) : (
          <>
            Find work that<br />
            <span style={{ color: "var(--brand)" }}>actually ships.</span>
          </>
        )}
      </h1>

      {/* Subtitle */}
      <p
        className="hero-subtitle"
        style={{
          color: "var(--text-muted)",
          lineHeight: 1.7,
          maxWidth: "30rem",
          letterSpacing: "-0.01em",
          marginBottom: "2.25rem",
          opacity: 0,
          animation: "fadeUp 0.55s 0.36s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient
          ? "The Web3 freelancer marketplace. Browse verified talent, lock a budget, and pay securely when work is delivered."
          : "Browse real jobs from real Web3 teams. Get matched, get paid — protected by on-chain escrow so you never chase an invoice."}
      </p>

      {/* CTA buttons */}
      {isLoggedIn ? (
        <div
          className="hero-cta-row"
          style={{
            opacity: 0,
            animation: "fadeUp 0.55s 0.5s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link href="/talent" className="hero-pill-btn hero-pill-teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Browse Talent
          </Link>
          <Link href="/jobs" className="hero-pill-btn hero-pill-outline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div
          className="hero-cta-row"
          style={{
            opacity: 0,
            animation: "fadeUp 0.55s 0.5s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link
            href="/register"
            onClick={() => setMode("hiring")}
            className="hero-pill-btn hero-pill-teal"
          >
            Get started — it&apos;s free
          </Link>
          <Link href="/talent" className="hero-pill-btn hero-pill-outline">
            Browse talent
          </Link>
        </div>
      )}

      {/* Mode toggle hint */}
      <div
        style={{
          opacity: 0,
          animation: "fadeUp 0.5s 0.65s forwards",
          position: "relative",
          zIndex: 1,
          marginTop: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}
      >
        <span>{isClient ? "Looking for work?" : "Need to hire?"}</span>
        <button
          onClick={() => setMode(isClient ? "working" : "hiring")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--brand)",
            padding: 0,
            fontFamily: "inherit",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          {isClient ? "Find work instead →" : "Post a job instead →"}
        </button>
      </div>
    </>
  );
}
