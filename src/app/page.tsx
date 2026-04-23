import React from "react";
import Link from "next/link";
import { ShieldCheck, Clock, BadgeCheck } from "lucide-react";
import { auth } from "@/auth";
import db from "@/lib/db";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
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

  const rawFeatured = await db.user.findMany({
    where: { profileComplete: true, image: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 18,
    select: {
      twitterHandle: true, name: true, image: true, userTitle: true, bio: true,
      availability: true, skills: true, lastSeenAt: true, walletAddress: true,
      gigs: {
        where: { status: "active" },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      sellerOrders: { where: { status: "completed" }, select: { id: true } },
      reviewsReceived: { select: { rating: true } },
    },
  }).catch(() => []);

  function profileQuality(u: any): number {
    let s = 0;
    if (u.walletAddress) s += 4;
    if ((u.reviewsReceived?.length ?? 0) > 0) s += 4;
    if ((u.sellerOrders?.length ?? 0) > 0) s += 3;
    if (u.bio && u.bio.length > 10) s += 2;
    if (u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < 7 * 864e5) s += 2;
    if (u.gigs?.length > 0) s += 1;
    if (!u.name) s -= 3;
    return s;
  }

  const featuredFreelancers = [...rawFeatured]
    .sort((a, b) => profileQuality(b) - profileQuality(a))
    .slice(0, 6);


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
          Hire top freelancers.<br />
          Pay only when <span style={{ color: "#14B8A6" }}>work is done.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-subtitle"
          style={{
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            lineHeight: 1.85,
            maxWidth: "24rem",
            letterSpacing: "0.01em",
            marginBottom: "1.5rem",
            opacity: 0,
            animation: "fadeUp 0.6s 0.58s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          Post a job, get matched with talent, and pay securely after delivery.
        </p>

        {/* ── Search bar — mobile only (desktop uses navbar search) ── */}
        <div className="flex md:hidden" style={{
          opacity: 0, animation: "fadeUp 0.6s 0.65s forwards",
          position: "relative", zIndex: 1, width: "100%",
          justifyContent: "center",
          marginBottom: 16,
        }}>
          <HeroSearch />
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            opacity: 0,
            animation: "fadeUp 0.6s 0.72s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link href={isLoggedIn ? "/jobs/new" : "/register"} className="btn-hero-primary">
            Post a Job
          </Link>
          <Link
            href="/jobs"
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color 0.15s",
            }}
            onMouseEnter={undefined}
          >
            Looking for work?{" "}
            <span style={{ color: "#14B8A6", fontWeight: 600 }}>Find Jobs</span>
          </Link>
        </div>

        {/* Trust pills */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.82s forwards",
          position: "relative", zIndex: 1, marginBottom: 28,
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
        }}>
          {([
            { icon: <ShieldCheck size={12} strokeWidth={2} />, label: "Secure payments" },
            { icon: <BadgeCheck size={12} strokeWidth={2} />, label: "Verified freelancers" },
            { icon: <Clock size={12} strokeWidth={2} />, label: "No upfront risk" },
          ] as { icon: React.ReactNode; label: string }[]).map((t) => (
            <span key={t.label} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: "0.72rem", fontWeight: 500, color: "var(--text-muted)",
              background: "var(--surface)", border: "1px solid var(--card-border)",
              borderRadius: 99, padding: "4px 10px",
            }}>
              <span style={{ color: "#14B8A6", display: "flex", alignItems: "center" }}>{t.icon}</span>
              {t.label}
            </span>
          ))}
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

      {/* ── ECOSYSTEM SPOTLIGHT ── */}
      <div style={{ padding: "clamp(1.25rem,3vw,2rem) clamp(1rem,4vw,2rem)", background: "var(--background)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          {/* Section overline */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Curated opportunity
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--card-border)" }} />
          </div>

          {/* Banner — image left (38%), content right */}
          <div className="eco-banner" style={{
            display: "grid", gridTemplateColumns: "minmax(0,38%) 1fr",
            borderRadius: 18, border: "1px solid var(--card-border)",
            background: "var(--card-bg)", overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}>

            {/* Image panel */}
            <div style={{ position: "relative", background: "#0B0B2E", overflow: "hidden", minHeight: 240 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://pbs.twimg.com/media/HGfbHMtbQAAGEv1?format=jpg&name=large"
                alt="Solana Summit Germany"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Spotlight badge */}
              <div style={{
                position: "absolute", top: 14, left: 14,
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#0d9488", color: "#fff",
                fontSize: "9.5px", fontWeight: 800, letterSpacing: "0.9px", textTransform: "uppercase" as const,
                padding: "5px 9px", borderRadius: 7,
                boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l1.5 5L19 8l-4.5 3.5L16 17l-4-3-4 3 1.5-5.5L5 8l5.5-1z"/>
                </svg>
                Spotlight
              </div>
            </div>

            {/* Content panel */}
            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.1rem" }}>

              <div>
                {/* Solana kicker */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "9.5px", fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "0.9rem" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: "linear-gradient(135deg,#9945FF,#14F195)", flexShrink: 0 }} />
                  Powered by{" "}
                  <span style={{ background: "linear-gradient(90deg,#9945FF,#14F195)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900 }}>
                    SOLANA
                  </span>
                  · Curated by Superteam Germany
                </div>

                {/* Publisher row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                  {/* Avatar — Superteam Germany circle logo */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: "1.5px solid var(--card-border)", background: "radial-gradient(circle at 25% 30%, #1a0000 0%, #8B0000 30%, #cc2200 55%, #e65c00 75%, #f5a623 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: "#fff", letterSpacing: "-1px", fontFamily: "Inter, sans-serif", lineHeight: 1, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>st</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--foreground)" }}>Superteam Germany</span>
                      <span style={{ width: 15, height: 15, borderRadius: "50%", background: "#14b8a6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <a
                        href="https://x.com/SuperteamDE"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "11px", fontWeight: 600, color: "#14b8a6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 2 }}
                      >
                        View on X
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M9 7h8v8"/>
                        </svg>
                      </a>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 1 }}>@SuperteamDE · Solana DACH</div>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(0.95rem,2vw,1.1rem)", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.4rem", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                  Content Creators Program &amp; $500 Travel Boost — Solana Summit Germany
                </h3>

                {/* Description */}
                <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: "0 0 0.85rem", lineHeight: 1.6 }}>
                  Selected creators will join Solana Summit Germany and receive exclusive on-site benefits. Some participants may also receive a $500 travel boost.
                </p>

                {/* Info row */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.1rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11.5px", fontWeight: 500, color: "var(--text-muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    Germany
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11.5px", fontWeight: 500, color: "var(--text-muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    IRL Event
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11.5px", fontWeight: 500, color: "var(--text-muted)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    Content
                  </div>
                </div>

                {/* Tags — max 3 */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {(["✨ Ecosystem", "Content", "IRL"] as const).map((tag, i) => (
                    <span key={tag} style={{
                      fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                      background: i === 0 ? "rgba(20,184,166,0.08)" : "var(--background)",
                      color: i === 0 ? "#0d9488" : "var(--text-muted)",
                      border: i === 0 ? "1px solid rgba(20,184,166,0.2)" : "1px solid var(--card-border)",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefit + CTA */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", paddingTop: "1.1rem", borderTop: "1px solid var(--card-border)" }}>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#14b8a6" }}>
                    Exclusive on-site benefits
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4, fontWeight: 400 }}>Chance to receive a $500 travel boost</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  <a
                    href="https://t.co/4EFTnBjaWn"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "0.65rem 1.3rem", borderRadius: 10,
                      background: "var(--foreground)", color: "var(--dropdown-bg)",
                      fontWeight: 700, fontSize: "0.82rem", textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Apply now
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M9 7h8v8"/>
                    </svg>
                  </a>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>Limited spots available</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        <style>{`
          @media (max-width: 680px) {
            .eco-banner { grid-template-columns: 1fr !important; }
            .eco-banner > div:first-child { aspect-ratio: 16/9; min-height: 0 !important; }
          }
        `}</style>
      </div>

      {/* ── FEATURED FREELANCERS ── */}
      {featuredFreelancers.length > 0 && (
        <div style={{ background: "var(--background)", padding: "clamp(1.5rem,4vw,2.5rem) 0", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 clamp(1rem,4vw,2rem)" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "clamp(1.5rem,3vw,2rem)" }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14B8A6", marginBottom: "0.4rem" }}>
                  Featured talent
                </div>
                <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.3rem,2.8vw,1.75rem)", color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Top freelancers, ready to hire
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
                  Verified profiles with real reviews and track records
                </p>
              </div>
              <Link href="/talent" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#14b8a6", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                Browse all →
              </Link>
            </div>
            <div style={{ display: "grid", gap: "clamp(0.75rem,2vw,1.25rem)" }} className="ff-grid">
              {featuredFreelancers.map((f: any) => {
                const minPrice = f.gigs?.[0]?.price ?? null;
                const completedCount = f.sellerOrders?.length ?? 0;
                const isAvail = f.availability === "available";
                const isVerified = !!f.walletAddress;
                const reviews: { rating: number }[] = f.reviewsReceived ?? [];
                const avgRating = reviews.length > 0
                  ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
                  : null;
                const activeRecently = f.lastSeenAt
                  ? (Date.now() - new Date(f.lastSeenAt).getTime()) < 7 * 864e5
                  : false;
                return (
                  <Link
                    key={f.twitterHandle}
                    href={`/u/${f.twitterHandle}`}
                    style={{
                      background: "var(--surface)", border: "1px solid var(--card-border)",
                      borderRadius: 14, padding: "14px 14px 12px",
                      textDecoration: "none", color: "inherit",
                      display: "flex", flexDirection: "column", gap: 8,
                      transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
                    }}
                    className="ff-card"
                  >
                    {/* Header: avatar left, name/role right */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                        <span style={{
                          position: "absolute", bottom: 1, right: 1, width: 9, height: 9,
                          borderRadius: "50%", border: "2px solid var(--surface)",
                          background: isAvail ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#94a3b8",
                        }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1, paddingTop: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name ?? f.twitterHandle}
                          </span>
                          {isVerified && (
                            <span className="cbadge-wrap" style={{ flexShrink: 0 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", background: "#14B8A6" }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                              <span className="cbadge-tip">Verified identity</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.userTitle ?? "Freelancer"}
                        </div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      {avgRating !== null ? (
                        <>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#92400e", background: "#fef3c7", borderRadius: 99, padding: "2px 7px" }}>
                            ⭐ {avgRating.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                            {completedCount} job{completedCount !== 1 ? "s" : ""}
                          </span>
                          {activeRecently && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#15803d", background: "rgba(34,197,94,0.12)", borderRadius: 99, padding: "2px 7px" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                              Active
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", background: "var(--background)", border: "1px solid var(--card-border)", borderRadius: 99, padding: "2px 7px" }}>
                            ⭐ New
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#15803d", background: "rgba(34,197,94,0.12)", borderRadius: 99, padding: "2px 7px" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                            Available
                          </span>
                        </>
                      )}
                    </div>

                    {/* Skill tags */}
                    {(f.skills as string[] | null)?.length ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(f.skills as string[]).slice(0, 3).map((skill: string) => (
                          <span key={skill} style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", background: "var(--background)", border: "1px solid var(--card-border)", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Price footer */}
                    <div style={{ marginTop: "auto", borderTop: "1px solid var(--card-border)", paddingTop: 9, display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#14B8A6", letterSpacing: "-0.01em" }}>
                        From ${minPrice != null ? minPrice : 50}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>/ project</span>
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
          .ff-card {
            transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
          }
          .ff-card:hover {
            transform: translateY(-3px) scale(1.012);
            box-shadow: 0 10px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04);
            border-color: rgba(20,184,166,0.4) !important;
          }
          .cbadge-wrap { position: relative; display: inline-flex; align-items: center; cursor: default; }
          .cbadge-tip {
            display: none; position: absolute; bottom: calc(100% + 6px); left: 50%;
            transform: translateX(-50%);
            background: #0f172a; color: #e2e8f0; font-size: 11px; font-weight: 500;
            padding: 4px 9px; border-radius: 6px; white-space: nowrap;
            pointer-events: none; z-index: 99;
            border: 1px solid rgba(20,184,166,0.25);
          }
          .cbadge-tip::after {
            content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
            border: 4px solid transparent; border-top-color: #0f172a;
          }
          .cbadge-wrap:hover .cbadge-tip { display: block; }
        `}</style>
      </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ padding: "clamp(3rem,6vw,5rem) clamp(1rem,4vw,2rem)", background: "var(--card-bg)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14B8A6", marginBottom: "0.4rem" }}>
              Simple process
            </div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.3rem,2.8vw,1.75rem)", color: "var(--foreground)", margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
              How it works
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: 0, lineHeight: 1.5 }}>Three steps. No hassle.</p>
          </div>

          <div style={{ display: "grid", gap: "clamp(0.75rem,2vw,1.25rem)" }} className="hiw-grid">
            {([
              {
                step: "1",
                title: "Post a job",
                desc: "Describe what you need. It takes 2 minutes and it's free.",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                ),
                color: "#6366f1",
                bg: "rgba(99,102,241,0.1)",
              },
              {
                step: "2",
                title: "Hire a freelancer",
                desc: "Browse profiles, read reviews, and message candidates directly. Pick the best fit.",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <polyline points="16 11 18 13 22 9"/>
                  </svg>
                ),
                color: "#14b8a6",
                bg: "rgba(20,184,166,0.1)",
              },
              {
                step: "3",
                title: "Pay after delivery",
                desc: "Your payment is held safely and only released when you approve the work. No risk.",
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ),
                color: "#22c55e",
                bg: "rgba(34,197,94,0.1)",
              },
            ] as { step: string; title: string; desc: string; icon: React.ReactNode; color: string; bg: string }[]).map((item, i) => (
              <div key={item.step} className="hiw-card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem", borderRadius: 14, background: "var(--background)", border: "1px solid var(--card-border)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: item.color, textTransform: "uppercase" as const, marginBottom: 5 }}>Step {item.step}</div>
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--foreground)", margin: "0 0 0.3rem", letterSpacing: "-0.01em" }}>{item.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "clamp(1.5rem,3vw,2.5rem)" }}>
            <Link href={isLoggedIn ? "/jobs/new" : "/register"} className="btn-hero-primary" style={{ display: "inline-flex" }}>
              Post a Job — it&apos;s free
            </Link>
          </div>
        </div>
        <style>{`
          .hiw-grid { grid-template-columns: repeat(3,1fr); }
          @media (max-width: 700px) { .hiw-grid { grid-template-columns: 1fr; } }
          .hiw-card {
            transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
          }
          .hiw-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.07);
            border-color: rgba(20,184,166,0.2) !important;
          }
        `}</style>
      </div>

    </main>
    </>
  );
}
