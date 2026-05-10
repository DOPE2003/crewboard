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
          letterSpacing: "-0.03em",
          lineHeight: 1.0,
          marginBottom: "2rem",
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
          fontSize: "1.05rem",
          lineHeight: 1.6,
          maxWidth: "30rem",
          letterSpacing: "-0.01em",
          marginBottom: "2.25rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.58s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient
          ? "A curated marketplace for production teams. Browse verified talent, lock a budget, and pay securely when the work is delivered."
          : "Browse real jobs from real productions. Get matched, get paid — secured by escrow so you never chase an invoice."}
      </p>

      <div className="flex md:hidden" style={{
        opacity: 0, animation: "fadeUp 0.6s 0.65s forwards",
        position: "relative", zIndex: 1, width: "100%",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <HeroSearch />
      </div>

      {isLoggedIn && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
          maxWidth: 480,
          marginBottom: 36,
          opacity: 0,
          animation: "fadeUp 0.6s 0.72s forwards",
          position: "relative",
          zIndex: 1,
        }}>
          <Link
            href="/talent"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderRadius: 14, textDecoration: "none",
              background: "var(--surface)",
              border: "1px solid var(--card-border)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            className="hero-action-card"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2 }}>Find Talent</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-muted)" }}>Build your own crew</span>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>

          <Link
            href="/jobs"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 20px", borderRadius: 14, textDecoration: "none",
              background: "var(--surface)",
              border: "1px solid var(--card-border)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            className="hero-action-card"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2 }}>Find Jobs</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-muted)" }}>Get hired by Web3 Crew</span>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </Link>
        </div>
      )}

      {!isLoggedIn && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          width: "100%",
          maxWidth: 480,
          marginBottom: 36,
          opacity: 0,
          animation: "fadeUp 0.6s 0.72s forwards",
          position: "relative",
          zIndex: 1,
        }}>
          <Link
            href="/register"
            onClick={() => setMode("hiring")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "18px 20px", borderRadius: 14, textDecoration: "none",
              background: isClient ? "var(--brand)" : "var(--surface)",
              color: isClient ? "#0f172a" : "var(--foreground)",
              border: isClient ? "1px solid var(--brand)" : "1px solid var(--card-border)",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: isClient ? "0 4px 16px rgba(20,184,166,0.30)" : "none",
            }}
            className="intent-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
            <span style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.2 }}>I&apos;m Hiring</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 500, opacity: isClient ? 0.72 : 1, color: isClient ? undefined : "var(--text-muted)", marginTop: 4 }}>Post a job for free</span>
          </Link>

          <Link
            href="/login"
            onClick={() => setMode("working")}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "18px 20px", borderRadius: 14, textDecoration: "none",
              background: !isClient ? "var(--brand)" : "var(--surface)",
              color: !isClient ? "#0f172a" : "var(--foreground)",
              border: !isClient ? "1px solid var(--brand)" : "1px solid var(--card-border)",
              transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
              boxShadow: !isClient ? "0 4px 16px rgba(20,184,166,0.30)" : "none",
            }}
            className="intent-card"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8, color: !isClient ? "#0f172a" : "var(--brand)" }}>
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="2"/>
              <path d="M6 12H4M20 12h-2"/>
            </svg>
            <span style={{ fontSize: "1rem", fontWeight: 800, lineHeight: 1.2 }}>I&apos;m a Freelancer</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: !isClient ? undefined : "var(--text-muted)", opacity: !isClient ? 0.72 : 1, marginTop: 4 }}>Find work &amp; get paid</span>
          </Link>
        </div>
      )}
      <style>{`
        .intent-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; border-color: rgba(20,184,166,0.5) !important; }
        .hero-action-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; border-color: rgba(20,184,166,0.4) !important; }
      `}</style>
    </>
  );
}
