import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import ScrollToTrustButton from "@/components/home/ScrollToTrustButton";
import HeroSearch from "@/components/home/HeroSearch";
import "@/styles/landing.css";


export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const rawProfiles = await db.user.findMany({
    where: { profileComplete: true, image: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      twitterHandle: true, name: true, image: true, userTitle: true,
      availability: true, skills: true, bio: true, createdAt: true,
      sellerOrders: { where: { status: "completed" }, select: { amount: true } },
    },
  }).catch(() => []);

  const floatingProfiles = rawProfiles.map((u: any) => ({
    twitterHandle: u.twitterHandle,
    name: u.name,
    image: u.image,
    role: u.userTitle,
    availability: u.availability,
    skills: u.skills,
    bio: u.bio,
    ordersCompleted: (u.sellerOrders as Array<{ amount: number }> ?? []).length,
    totalEarned: (u.sellerOrders as Array<{ amount: number }>).reduce((s: number, o: { amount: number }) => s + o.amount, 0),
    memberSince: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  }));

  const featuredFreelancers = await db.user.findMany({
    where: { profileComplete: true, image: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      twitterHandle: true, name: true, image: true, userTitle: true,
      availability: true, skills: true,
      gigs: {
        where: { status: "active" },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      sellerOrders: { where: { status: "completed" }, select: { id: true } },
    },
  }).catch(() => []);


  const userName = session?.user?.name?.split(" ")[0] ?? (session?.user as any)?.twitterHandle ?? "Builder";

  return (
    <>
    <main className="page landing-page-main">

      {/* ── HERO ── */}
      <div
        className="landing-hero hero-compact-mobile"
        style={{
          minHeight: "max(100vh, 700px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "center",
          padding: "clamp(2rem, 5vw, 3.5rem) clamp(1rem, 4vw, 2rem) clamp(8rem, 14vw, 12rem)",
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Glow — desktop only */}
        <div className="hidden md:block" style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(260px, 90vw, 760px)",
          height: "clamp(180px, 32vw, 380px)",
          background: "radial-gradient(ellipse at 50% 50%, rgba(45,212,191,0.28) 0%, rgba(20,184,166,0.12) 50%, transparent 75%)",
          filter: "blur(28px)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Floating profile cards — desktop only */}
        <div className="hidden md:block" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            {floatingProfiles.length >= 2 && (
              <HeroFloatingProfiles profiles={floatingProfiles} />
            )}
          </div>
        </div>

        {/* Beta badge */}
        <div
          className="hero-beta-badge"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            color: "#0F6E56",
            marginTop: "0.5rem",
            marginBottom: "1.5rem",
            padding: "0.35rem 0.85rem",
            border: "1px solid #14B8A6",
            borderRadius: "999px",
            background: "transparent",
            opacity: 0,
            animation: "fadeUp 0.6s 0.1s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          ✦ Now in Beta
        </div>

        {/* Headline */}
        <h1
          className="hero-h1"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 300,
            letterSpacing: "-0.01em",
            lineHeight: 0.93,
            marginBottom: "1.5rem",
            color: "var(--foreground)",
            opacity: 0,
            animation: "fadeUp 0.6s 0.25s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          Hire your next<br />
          Web3 <span style={{ color: "#14B8A6" }}>freelancer.</span>
        </h1>

        {/* Welcome back */}
        {isLoggedIn && (
          <div
            className="hero-welcome-block"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.3rem",
              marginBottom: "1rem",
              opacity: 0,
              animation: "fadeUp 0.6s 0.38s forwards",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span className="hero-welcome-label" style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.6875rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "var(--text-muted)",
            }}>
              Welcome back
            </span>
            <span className="hero-welcome-name" style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "2rem",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: "var(--text-1)",
            }}>
              {userName}
            </span>
          </div>
        )}

        {/* Subtitle */}
        <p
          className="hero-subtitle"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            lineHeight: 1.85,
            maxWidth: "22rem",
            letterSpacing: "0.01em",
            marginBottom: "1.25rem",
            opacity: 0,
            animation: "fadeUp 0.6s 0.58s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          Connect with builders. Ship real products.
          <span className="hidden md:inline"><br />The professional network Web3 deserves.</span>
        </p>

        {/* ── Trust signal — moved above CTAs for mobile ── */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.62s forwards",
          position: "relative", zIndex: 1, marginBottom: 20,
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(20,184,166,0.07)",
          border: "1px solid rgba(20,184,166,0.25)",
          borderRadius: 99, padding: "6px 14px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize: "0.72rem", color: "var(--foreground)", fontWeight: 600 }}>
            Payments secured on-chain via <span style={{ color: "#14B8A6" }}>Solana escrow</span>
          </span>
        </div>

        {/* ── Search bar — mobile only (desktop uses navbar search) ── */}
        <div className="flex md:hidden" style={{
          opacity: 0, animation: "fadeUp 0.6s 0.7s forwards",
          position: "relative", zIndex: 1, width: "100%",
          justifyContent: "center",
          marginBottom: 16,
        }}>
          <HeroSearch />
        </div>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 32,
            opacity: 0,
            animation: "fadeUp 0.6s 0.78s forwards",
            position: "relative",
            zIndex: 1,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link href="/talent" className="btn-hero-primary">
            Browse Profiles
          </Link>
          <Link href="/jobs" className="btn-hero-secondary">
            Browse Jobs
          </Link>
          <Link href={isLoggedIn ? "/gigs/new" : "/register"} className="btn-hero-secondary">
            {isLoggedIn ? "Post a Service" : "Join as Freelancer"}
          </Link>
        </div>

        {/* Three trust pills — desktop only */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.85s forwards",
          position: "relative", zIndex: 1, marginBottom: 28,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
        }} className="hidden md:flex">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>, label: "On-chain escrow" },
              { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>, label: "No upfront risk" },
              { icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>, label: "Secure wallet payments" },
            ].map((item) => (
              <span key={item.label} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: "0.7rem", fontWeight: 600,
                color: "var(--text-muted)",
                background: "rgba(var(--foreground-rgb,0,0,0),0.04)",
                border: "1px solid var(--card-border)",
                padding: "4px 10px", borderRadius: 99,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
                {item.label}
              </span>
            ))}
          </div>

          {/* How escrow works link */}
          <ScrollToTrustButton />
        </div>

        {/* Scroll indicator — desktop only */}
        <div className="hidden md:flex" style={{
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          opacity: 0,
          animation: "fadeUp 0.6s 0.85s forwards",
          position: "relative",
          zIndex: 1,
        }}>
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.42rem",
            letterSpacing: "0.25em",
            color: "var(--text-muted)",
            textTransform: "uppercase" as const,
            marginBottom: "0.5rem",
            opacity: 0.4,
          }}>Scroll</span>
          <div className="scroll-line" />
        </div>
      </div>


      {/* ── TRENDING FREELANCERS (mobile-first horizontal scroll) ── */}
      {featuredFreelancers.length > 0 && (
        <div style={{ background: "var(--background)", padding: "clamp(1.5rem,4vw,2.5rem) 0", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(1rem,4vw,2rem)", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14B8A6", display: "inline-block", animation: "tealPulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "#14B8A6" }}>Trending</span>
              </div>
              <Link href="/talent" style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textDecoration: "none" }}>
                View all →
              </Link>
            </div>
            {/* Horizontal scroll row */}
            <div style={{
              display: "flex", gap: "0.75rem", overflowX: "auto", scrollbarWidth: "none",
              padding: "0 clamp(1rem,4vw,2rem) 0.5rem",
              WebkitOverflowScrolling: "touch",
            } as React.CSSProperties}>
              {featuredFreelancers.slice(0, 6).map((f: any) => {
                const minPrice = f.gigs?.[0]?.price ?? null;
                const completedCount = f.sellerOrders?.length ?? 0;
                const isAvail = f.availability === "available";
                const initials = (f.name ?? f.twitterHandle ?? "?")[0].toUpperCase();
                return (
                  <Link
                    key={f.twitterHandle}
                    href={`/u/${f.twitterHandle}`}
                    style={{
                      flexShrink: 0, width: 160,
                      background: "var(--surface)", border: "1px solid var(--card-border)",
                      borderRadius: 14, padding: "1rem",
                      textDecoration: "none", color: "inherit",
                      display: "flex", flexDirection: "column", gap: 8,
                      transition: "box-shadow 0.2s, transform 0.2s",
                    }}
                    className="trending-card"
                  >
                    {/* Avatar */}
                    <div style={{ position: "relative", width: 44, height: 44 }}>
                      {f.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.image} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#14B8A6,#0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
                          {initials}
                        </div>
                      )}
                      <span style={{
                        position: "absolute", bottom: 1, right: 1, width: 10, height: 10,
                        borderRadius: "50%", border: "2px solid var(--surface)",
                        background: isAvail ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#94a3b8",
                      }} />
                    </div>
                    {/* Name + role */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {f.name ?? `@${f.twitterHandle}`}
                      </div>
                      {f.userTitle && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {f.userTitle}
                        </div>
                      )}
                    </div>
                    {/* Price + orders */}
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      {minPrice != null && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#14B8A6" }}>
                          from ${minPrice}
                        </span>
                      )}
                      {completedCount > 0 && (
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                          {completedCount} done
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CATEGORIES ── */}
      <div id="categories" style={{ padding: "clamp(3rem,6vw,5rem) clamp(1rem,4vw,2rem)", background: "var(--background)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#14b8a6", marginBottom: "0.75rem", fontWeight: 700 }}>
              Talent Marketplace
            </div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "var(--foreground)", margin: "0 0 0.75rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              Browse by category
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "28rem", margin: "0 auto" }}>
              Find the right talent for your needs
            </p>
          </div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(0.75rem,2vw,1.25rem)",
          }}
          className="cat-grid"
          >
            {([
              {
                title: "Web3 Developer",
                href: "/talent?role=Coding+%26+Tech",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                  </svg>
                ),
                color: "#6366f1",
                bg: "rgba(99,102,241,0.08)",
              },
              {
                title: "Smart Contract Engineer",
                href: "/talent?role=Coding+%26+Tech",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                color: "#14b8a6",
                bg: "rgba(20,184,166,0.08)",
              },
              {
                title: "AI Engineer",
                href: "/talent?role=AI+Engineer",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                    <circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>
                  </svg>
                ),
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
              },
              {
                title: "KOL Manager",
                href: "/talent?role=KOL+Manager",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                color: "#ec4899",
                bg: "rgba(236,72,153,0.08)",
              },
              {
                title: "Designer",
                href: "/talent?role=Graphic+%26+Design",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 20v-8.5"/>
                    <path d="M12 20c-3.87 0-7-3.13-7-7"/>
                    <path d="M12 20c3.87 0 7-3.13 7-7"/>
                  </svg>
                ),
                color: "#8b5cf6",
                bg: "rgba(139,92,246,0.08)",
              },
              {
                title: "Marketing",
                href: "/talent?role=Social+Marketing",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                  </svg>
                ),
                color: "#0ea5e9",
                bg: "rgba(14,165,233,0.08)",
              },
            ] as { title: string; href: string; icon: React.ReactNode; color: string; bg: string }[]).map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="cat-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "clamp(1.1rem,2.5vw,1.5rem)",
                  borderRadius: 16,
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  textDecoration: "none",
                  transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: cat.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: cat.color,
                  flexShrink: 0,
                  transition: "transform 0.2s",
                }}>
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                    {cat.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: cat.color, letterSpacing: "0.04em" }}>Browse →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <style>{`
          .cat-grid { grid-template-columns: repeat(3, 1fr); }
          @media (max-width: 900px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 480px) { .cat-grid { grid-template-columns: repeat(2, 1fr); } }
          .cat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 28px rgba(0,0,0,0.08);
            border-color: rgba(20,184,166,0.35) !important;
          }
        `}</style>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ padding: "clamp(3rem,6vw,5.5rem) clamp(1rem,4vw,2rem)", background: "var(--card-bg)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3.5rem)" }}>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#14b8a6", marginBottom: "0.75rem", fontWeight: 700 }}>Simple Process</div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "var(--foreground)", margin: "0 0 0.75rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>How it works</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "28rem", margin: "0 auto" }}>From hiring to delivery — three steps, fully on-chain.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", alignItems: "start", gap: "clamp(0.5rem,2vw,1.5rem)" }} className="hiw-grid">
            {([
              {
                step: "01",
                title: "Find Talent",
                desc: "Browse vetted Web3 builders by role, skill, and availability. Message directly — no intermediaries.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                ),
                color: "#6366f1",
                bg: "rgba(99,102,241,0.1)",
              },
              {
                step: "02",
                title: "Fund Securely via Escrow",
                desc: "Funds are locked in a Solana smart contract — not held by us, not by the freelancer. They're released only when you approve the work.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                color: "#14b8a6",
                bg: "rgba(20,184,166,0.1)",
              },
              {
                step: "03",
                title: "Get Work Delivered",
                desc: "Review the deliverable. Release payment on approval — funds go directly to the builder's wallet.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ),
                color: "#22c55e",
                bg: "rgba(34,197,94,0.1)",
              },
            ] as { step: string; title: string; desc: string; icon: React.ReactNode; color: string; bg: string }[]).reduce<React.ReactNode[]>((acc, item, i, arr) => {
              acc.push(
                <div key={item.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", color: item.color, marginBottom: "0.4rem", textTransform: "uppercase" as const }}>{item.step}</div>
                    <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.05rem", color: "var(--foreground)", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>{item.title}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.65, margin: 0, maxWidth: "18rem" }}>{item.desc}</p>
                  </div>
                </div>
              );
              if (i < arr.length - 1) {
                acc.push(
                  <div key={`arrow-${i}`} className="hiw-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 20, color: "var(--text-muted)", opacity: 0.4 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                );
              }
              return acc;
            }, [])}
          </div>
        </div>
        <style>{`
          .hiw-grid { grid-template-columns: 1fr auto 1fr auto 1fr; }
          .hiw-arrow { display: flex !important; }
          @media (max-width: 700px) {
            .hiw-grid { grid-template-columns: 1fr !important; }
            .hiw-arrow { display: none !important; }
          }
        `}</style>
      </div>

      {/* ── FEATURED FREELANCERS ── */}
      <div id="browse" style={{ padding: "clamp(3rem,6vw,5.5rem) clamp(1rem,4vw,2rem)", background: "var(--background)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#14b8a6", marginBottom: "0.75rem", fontWeight: 700 }}>Ready to hire</div>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Featured Freelancers</h2>
            </div>
            <Link href="/talent" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#14b8a6", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              View all talent
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(0.75rem,2vw,1.25rem)" }} className="ff-grid">
            {featuredFreelancers.map((u) => {
              const minPrice = (u as any).gigs?.[0]?.price ?? null;
              const completedCount = (u as any).sellerOrders?.length ?? 0;
              const initial = ((u.name ?? u.twitterHandle) || "U")[0].toUpperCase();
              return (
                <Link
                  key={u.twitterHandle}
                  href={`/u/${u.twitterHandle}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    padding: "1.25rem",
                    borderRadius: 16,
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    textDecoration: "none",
                    transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                  }}
                  className="ff-card"
                >
                  {/* Avatar + availability */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.image} alt={u.name ?? u.twitterHandle} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--card-border)" }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#14b8a6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff" }}>{initial}</div>
                    )}
                    {u.availability === "available" && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.65rem", fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", padding: "3px 8px", borderRadius: 99 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                        Available
                      </span>
                    )}
                  </div>

                  {/* Name + role */}
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.92rem", color: "var(--foreground)", marginBottom: 2 }}>{u.name ?? `@${u.twitterHandle}`}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{(u as any).userTitle ?? "Web3 Builder"}</div>
                  </div>

                  {/* Skills */}
                  {Array.isArray((u as any).skills) && (u as any).skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {((u as any).skills as string[]).slice(0, 3).map((s: string) => (
                        <span key={s} style={{ fontSize: "0.65rem", fontWeight: 600, color: "#14b8a6", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.18)", padding: "2px 8px", borderRadius: 99 }}>{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Footer: orders + price */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid var(--card-border)" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {completedCount > 0 ? `${completedCount} order${completedCount !== 1 ? "s" : ""} completed` : "New freelancer"}
                    </span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: minPrice != null ? "#14b8a6" : "var(--text-muted)" }}>
                      {minPrice != null ? `from $${minPrice}` : "Price on request"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {featuredFreelancers.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No freelancers yet — <Link href="/register" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>be the first to join</Link>.
            </div>
          )}
        </div>
        <style>{`
          .ff-grid { grid-template-columns: repeat(3,1fr); }
          @media (max-width: 900px) { .ff-grid { grid-template-columns: repeat(2,1fr); } }
          @media (max-width: 500px) { .ff-grid { grid-template-columns: 1fr; } }
          .ff-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.07); border-color: rgba(20,184,166,0.3) !important; }
        `}</style>
      </div>

      {/* ── TRUST SECTION ── */}
      <div id="trust" style={{ padding: "clamp(3rem,6vw,5.5rem) clamp(1rem,4vw,2rem)", background: "var(--card-bg)", borderTop: "1px solid var(--card-border)", borderBottom: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#14b8a6", marginBottom: "0.75rem", fontWeight: 700 }}>Built for Web3</div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.75rem,3.5vw,2.5rem)", color: "var(--foreground)", margin: "0 0 0.75rem", letterSpacing: "-0.02em", lineHeight: 1.15 }}>Hire without the risk</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "28rem", margin: "0 auto" }}>Every order on Crewboard is protected end-to-end — from the first message to the final payment.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "clamp(0.75rem,2vw,1.5rem)" }} className="trust-grid">
            {([
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ),
                color: "#14b8a6",
                bg: "rgba(20,184,166,0.08)",
                title: "On-Chain Escrow",
                desc: "Funds are locked in a Solana smart contract the moment an order starts. No one can move them until you approve delivery.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
                  </svg>
                ),
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
                title: "Verified Talent",
                desc: "Every freelancer on Crewboard is a real Web3 builder with a verified on-chain identity — no fake accounts.",
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                ),
                color: "#6366f1",
                bg: "rgba(99,102,241,0.08)",
                title: "No Upfront Risk",
                desc: "You only release payment when the work meets your standards. Dispute resolution is built into the protocol.",
              },
            ] as { icon: React.ReactNode; color: string; bg: string; title: string; desc: string }[]).map((item) => (
              <div key={item.title} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "clamp(1.25rem,2.5vw,1.75rem)", borderRadius: 16, background: "var(--background)", border: "1px solid var(--card-border)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>{item.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          .trust-grid { grid-template-columns: repeat(3,1fr); }
          @media (max-width: 900px) { .trust-grid { grid-template-columns: repeat(2,1fr); } }
          @media (max-width: 500px) { .trust-grid { grid-template-columns: 1fr; } }
        `}</style>
      </div>

    </main>
    </>
  );
}
