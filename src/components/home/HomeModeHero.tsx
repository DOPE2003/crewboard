"use client";
import Link from "next/link";
import { useMode } from "@/components/ModeProvider";
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
          fontWeight: 300,
          letterSpacing: "-0.01em",
          lineHeight: 0.93,
          marginBottom: "1rem",
          color: "var(--foreground)",
          opacity: 0,
          animation: "fadeUp 0.6s 0.25s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient ? (
          <>Hire top freelancers.<br />Pay only when <span style={{ color: "#14B8A6" }}>work is done.</span></>
        ) : (
          <>Find your next Web3 gig.<br /><span style={{ color: "#14B8A6" }}>Get paid</span> when delivered.</>
        )}
      </h1>

      <p
        className="hero-subtitle"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.88rem",
          lineHeight: 1.7,
          maxWidth: "24rem",
          letterSpacing: "0.01em",
          marginBottom: "1rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.58s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient
          ? "Post a job, get matched with talent, and pay securely after delivery."
          : "Browse jobs, pitch clients, and receive payment securely via escrow."}
      </p>

      <div className="flex md:hidden" style={{
        opacity: 0, animation: "fadeUp 0.6s 0.65s forwards",
        position: "relative", zIndex: 1, width: "100%",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <HeroSearch />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        width: "100%",
        maxWidth: 420,
        marginBottom: 14,
        opacity: 0,
        animation: "fadeUp 0.6s 0.72s forwards",
        position: "relative",
        zIndex: 1,
      }}>
        <Link
          href={isLoggedIn ? "/jobs/new" : "/register"}
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px", borderRadius: 12, textDecoration: "none",
            background: isClient ? "#14B8A6" : "var(--surface)",
            color: isClient ? "#0f172a" : "var(--foreground)",
            border: isClient ? "1px solid #14B8A6" : "1px solid var(--card-border)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          className="intent-card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}>
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
          </svg>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, lineHeight: 1.2 }}>I&apos;m Hiring</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 500, opacity: isClient ? 0.75 : 1, color: isClient ? undefined : "var(--text-muted)", marginTop: 2 }}>Post a job for free</span>
        </Link>

        <Link
          href={isLoggedIn ? "/jobs" : "/register"}
          style={{
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            padding: "14px 16px", borderRadius: 12, textDecoration: "none",
            background: !isClient ? "#14B8A6" : "var(--surface)",
            color: !isClient ? "#0f172a" : "var(--foreground)",
            border: !isClient ? "1px solid #14B8A6" : "1px solid var(--card-border)",
            transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
          }}
          className="intent-card"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6, color: !isClient ? "#0f172a" : "#14B8A6" }}>
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="2"/>
            <path d="M6 12H4M20 12h-2"/>
          </svg>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, lineHeight: 1.2 }}>I&apos;m a Freelancer</span>
          <span style={{ fontSize: "0.7rem", fontWeight: 500, color: !isClient ? undefined : "var(--text-muted)", opacity: !isClient ? 0.75 : 1, marginTop: 2 }}>Find work &amp; get paid</span>
        </Link>
      </div>
      <style>{`.intent-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-color: rgba(20,184,166,0.5) !important; }`}</style>
    </>
  );
}
