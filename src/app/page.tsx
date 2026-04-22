import React from "react";
import Link from "next/link";
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
          Hire top freelancers.<br />
          Pay only when <span style={{ color: "#14B8A6" }}>work is done.</span>
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

        {/* Trust line */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.82s forwards",
          position: "relative", zIndex: 1, marginBottom: 28,
          fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center",
        }}>
          <span>✔ Secure payments</span>
          <span>✔ Verified freelancers</span>
          <span>✔ No upfront risk</span>
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


      {/* ── FEATURED FREELANCERS ── */}
      {featuredFreelancers.length > 0 && (
        <div style={{ background: "var(--background)", padding: "clamp(1.5rem,4vw,2.5rem) 0", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 clamp(1rem,4vw,2rem)" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "clamp(1.5rem,3vw,2rem)" }}>
              <div>
                <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.4rem,3vw,2rem)", color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Top freelancers, ready to hire
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.4rem 0 0" }}>
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
                      flexShrink: 0, width: 168,
                      background: "var(--surface)", border: "1px solid var(--card-border)",
                      borderRadius: 14, padding: "1rem",
                      textDecoration: "none", color: "inherit",
                      display: "flex", flexDirection: "column", gap: 9,
                      transition: "box-shadow 0.2s, transform 0.2s",
                    }}
                    className="trending-card"
                  >
                    {/* Avatar + online dot */}
                    <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.image} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                      <span style={{
                        position: "absolute", bottom: 1, right: 1, width: 10, height: 10,
                        borderRadius: "50%", border: "2px solid var(--surface)",
                        background: isAvail ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#94a3b8",
                      }} />
                    </div>

                    {/* Name + verified */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 108 }}>
                          {f.name ?? f.twitterHandle}
                        </span>
                        {isVerified && (
                          <span className="cbadge-wrap">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#14B8A6" style={{ flexShrink: 0, display: "block" }}>
                              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                            <span className="cbadge-tip">Verified via wallet</span>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {f.userTitle ?? "Freelancer"}
                      </div>
                    </div>

                    {/* Stats row — always shown */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: avgRating !== null ? "#f59e0b" : "var(--text-muted)" }}>
                        {avgRating !== null ? `⭐ ${avgRating.toFixed(1)}` : "⭐ New"}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--card-border)" }}>·</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                        {completedCount} job{completedCount !== 1 ? "s" : ""}
                      </span>
                      {activeRecently && (
                        <>
                          <span style={{ fontSize: 10, color: "var(--card-border)" }}>·</span>
                          <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                            Active
                          </span>
                        </>
                      )}
                    </div>

                    {/* Price — always shown */}
                    <div style={{ marginTop: "auto", borderTop: "1px solid var(--card-border)", paddingTop: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: minPrice != null ? "#14B8A6" : "var(--text-muted)" }}>
                        {minPrice != null ? `From $${minPrice}` : "Price on request"}
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
          .cbadge-wrap { position: relative; display: inline-flex; align-items: center; cursor: default; }
          .cbadge-tip {
            display: none; position: absolute; bottom: calc(100% + 7px); left: 50%;
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
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.4rem,3vw,2rem)", color: "var(--foreground)", margin: "0 0 0.5rem", letterSpacing: "-0.02em" }}>
              How it works
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Three steps. No hassle.</p>
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
              <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.25rem", borderRadius: 14, background: "var(--background)", border: "1px solid var(--card-border)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", color: item.color, textTransform: "uppercase" as const, marginBottom: 4 }}>Step {item.step}</div>
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)", margin: "0 0 0.35rem", letterSpacing: "-0.01em" }}>{item.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
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
        `}</style>
      </div>

    </main>
    </>
  );
}
