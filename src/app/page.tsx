import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import ProofOfWorkFeed from "@/components/home/ProofOfWorkFeed";
import Web3NewsFeed from "@/components/home/Web3NewsFeed";
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

  const completedOrders = await db.order.findMany({
    where: { status: "completed" },
    include: {
      gig: {
        select: { id: true, title: true, description: true, category: true, tags: true },
      },
      seller: {
        select: { id: true, name: true, twitterHandle: true, image: true },
      },
      reviews: {
        select: { rating: true, body: true },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 12,
  }).catch(() => []);

  const userName = session?.user?.name?.split(" ")[0] ?? (session?.user as any)?.twitterHandle ?? "Builder";

  return (
    <main className="page landing-page-main">

      {/* ── HERO ── */}
      <div
        className="landing-hero"
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

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
            opacity: 0,
            animation: "fadeUp 0.6s 0.7s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/talent" className="btn-hero-primary">
              Browse Profiles
            </Link>
            <Link href={isLoggedIn ? "/gigs/new" : "/register"} className="btn-hero-secondary">
              {isLoggedIn ? "Post a Service" : "Join as Freelancer"}
            </Link>
          </div>
          <Link
            href="/gigs"
            style={{
              background: "transparent",
              color: "#14B8A6",
              padding: "12px 32px",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              border: "1.5px solid #14B8A6",
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Look for a Service
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          display: "flex",
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


      {/* ── PROOF OF WORK FEED ── */}
      <ProofOfWorkFeed orders={completedOrders} />

      {/* ── WEB3 NEWS FEED ── */}
      <Web3NewsFeed />

      {/* ── TRUST STRIP — desktop ── */}
      <div className="hidden md:block" style={{ borderTop: "1px solid var(--card-border)", borderBottom: "1px solid var(--card-border)", padding: "1.5rem 1.25rem", background: "var(--card-bg)", position: "relative", zIndex: 1 }}>
        <div className="trust-strip-inner" style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "2rem" }}>
          {[
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
                </svg>
              ),
              label: "Vetted Talent",
              desc: "All freelancers are real Web3 builders",
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ),
              label: "Protected Payments",
              desc: "Escrow smart contracts, funds released on delivery",
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
              label: "Hire Who You Need",
              desc: "Filter by role, skill, chain, and availability",
            },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "var(--foreground)", letterSpacing: "0.02em" }}>{item.label}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRUST STRIP — mobile ── */}
      <div className="block md:hidden" style={{ background: "#fff", padding: "20px 16px", position: "relative", zIndex: 1 }}>
        {[
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
              </svg>
            ),
            label: "Vetted Talent",
            desc: "Real Web3 builders only",
          },
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ),
            label: "Protected Payments",
            desc: "Solana escrow on every order",
          },
          {
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            ),
            label: "Ship Fast",
            desc: "Hire in minutes, not days",
          },
        ].map((item, i, arr) => (
          <div key={item.label} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
            borderBottom: i < arr.length - 1 ? "0.5px solid #f0f0f0" : "none",
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#E1F5EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: "#111" }}>{item.label}</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#6b7280", marginTop: 2 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="landing-section" style={{ padding: "clamp(2.5rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div className="section-label">Simple Process</div>
          <h2 style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            color: "var(--foreground)",
            marginBottom: "0.75rem",
            lineHeight: 1.15,
          }}>
            How it works
          </h2>
          <p style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            maxWidth: "36rem",
            marginBottom: "3rem",
          }}>
            From signing up to shipping your first project — here&apos;s the full journey on Crewboard.
          </p>

          <div className="how-it-works-grid">
            {([
              [
                { step: "01", title: "Create your account", desc: "Sign in with Twitter/X in one click or create a Crewboard ID. No forms, no passwords — your Web3 identity starts here.", tag: "Sign up" },
                { step: "02", title: "Build your profile", desc: "Choose your role, add your skills, and write a short bio. Your profile is your on-chain resume.", tag: "Identity" },
                { step: "03", title: "Browse the talent pool", desc: "Search and filter builders by role, skill, chain, and availability. Find exactly who you need.", tag: "Discover" },
              ],
              [
                { step: "04", title: "Hire or get hired", desc: "Founders send offers directly to builders. Builders apply to open services. No middlemen, no agencies.", tag: "Collaborate" },
                { step: "05", title: "Communicate in-platform", desc: "All coordination happens inside Crewboard. No DMs scattered across Discord, Telegram, or X.", tag: "Communicate" },
                { step: "06", title: "Ship & get paid", desc: "Deliver your work, get paid in SOL or USDC. Every completed service builds your verifiable on-chain reputation.", tag: "Grow" },
              ],
            ] as const).map((row, rowIdx) => (
              <div key={rowIdx} className="how-it-works-row">
                {row.map((item, i) => (
                  <React.Fragment key={item.step}>
                    <div className="how-it-works-card">
                      <div className="how-it-works-step-num">{item.step}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", position: "relative", zIndex: 1 }}>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.58rem", letterSpacing: "0.22em", color: "#2DD4BF", fontWeight: 700 }}>
                          {item.step}
                        </div>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "rgba(0,0,0,0.35)", background: "rgba(0,0,0,0.05)", padding: "0.2rem 0.55rem", borderRadius: 999 }}>
                          {item.tag}
                        </span>
                      </div>
                      <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.02em", color: "var(--foreground)", lineHeight: 1.2, position: "relative", zIndex: 1 }}>
                        {item.title}
                      </h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", lineHeight: 1.65, margin: 0, position: "relative", zIndex: 1 }}>
                        {item.desc}
                      </p>
                    </div>
                    {i < 2 && (
                      <div className="how-it-works-arrow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROADMAP ── */}
      <div className="roadmap-section">
        <div className="roadmap-inner">

          <div className="section-label">Platform Features</div>
          <h2 className="roadmap-title">
            How we&rsquo;re building Crewboard
          </h2>
          <p className="roadmap-subtitle">
            Transparent by default. Here&rsquo;s exactly where we are.
          </p>
          <p className="roadmap-intro">
            We&rsquo;re building this in public. Here&rsquo;s what&rsquo;s shipped, what&rsquo;s being built right now, and what&rsquo;s on the horizon.
          </p>

          <div className="roadmap-progress-wrap">
            <span className="roadmap-progress-label">5 of 11 features live &middot; updated Mar 2026</span>
            <div className="roadmap-progress-track">
              <div className="roadmap-progress-fill" />
            </div>
          </div>

          <div className="roadmap-grid">

            <div>
              <div className="roadmap-badge roadmap-badge-live">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Already Live
              </div>
              {[
                { title: "Web3-Native Profiles", desc: "Your on-chain identity. Connect with X or create a Crewboard ID — showcase your skills, bio, and work history to the builders who matter." },
                { title: "Crewboard ID", desc: "No Twitter? No problem. Create your account with email and own your professional identity independently of any social platform." },
                { title: "Talent Marketplace", desc: "The deepest pool of vetted Web3 talent on the internet. Filter by role, skill, chain, and availability — find exactly who you need in seconds." },
                { title: "Real-Time Messaging", desc: "Stop juggling 5 different apps. Every conversation, negotiation, and update happens in one place — fast, clean, and on-record." },
                { title: "Direct Orders", desc: "See someone you want to work with? Hire them directly. Agree on scope, set the price, and get moving — no back and forth, no middlemen." },
              ].map((item) => (
                <div key={item.title} className="roadmap-card roadmap-card-live">
                  <div className="roadmap-card-title">{item.title}</div>
                  <div className="roadmap-card-desc">{item.desc}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="roadmap-badge roadmap-badge-progress">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-5.66"/>
                </svg>
                In Progress
              </div>
              {[
                { title: "Escrow Smart Contracts", desc: "Money moves only when work is done. Funds are locked on-chain and released automatically on delivery — zero counterparty risk, zero trust required." },
                { title: "Instant Crypto Payouts", desc: "Get paid in SOL or USDC the moment your work is approved. No banks, no 3-5 business days, no fees eating your earnings." },
                { title: "On-Chain Reputation", desc: "Every order you complete writes to the blockchain. Your track record becomes a permanent, verifiable asset — owned by you, portable everywhere." },
              ].map((item) => (
                <div key={item.title} className="roadmap-card roadmap-card-progress">
                  <div className="roadmap-card-title">{item.title}</div>
                  <div className="roadmap-card-desc">{item.desc}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="roadmap-badge roadmap-badge-soon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Coming Soon
              </div>
              {[
                { title: "Multi-Chain Expansion", desc: "Crewboard launches on Solana. Ethereum, Arbitrum, and Polygon are next — one profile, every chain, one unified reputation across Web3." },
                { title: "NFT Skill Certificates", desc: "Your expertise, certified on-chain. Earn verifiable NFT credentials for every skill you master — proof that no one can fake, take away, or dispute." },
                { title: "DAO Governance", desc: "The platform belongs to its builders. Token holders vote on fees, features, and the future direction — Crewboard is owned by the community that built it." },
              ].map((item) => (
                <div key={item.title} className="roadmap-card roadmap-card-soon">
                  <div className="roadmap-card-title">{item.title}</div>
                  <div className="roadmap-card-desc">{item.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="landing-section landing-cta-section" style={{ padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem) clamp(4rem, 8vw, 8rem)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
          <div className="landing-cta-card" style={{
            borderRadius: 20,
            padding: "4rem 2.5rem",
            textAlign: "center",
            border: "1px solid var(--card-border)",
            background: "rgba(var(--foreground-rgb), 0.02)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "60%", background: "radial-gradient(ellipse, rgba(20,184,166,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            <div className="section-label" style={{ width: "fit-content", margin: "0 auto" }}>Join the Crew</div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--foreground)", margin: "1rem 0" }}>
              Ready to build with the best?
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.7, maxWidth: "32rem", margin: "0 auto 2.5rem" }}>
              Early builders are already here. Be part of the founding crew — find your next collaborator or your next project.
            </p>

            <div className="landing-cta-btns" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              {!isLoggedIn && (
                <Link className="btn-primary" href="/login">
                  Join as Freelancer
                </Link>
              )}
              <Link className="btn-outline" href="/talent">
                Find Talent
              </Link>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
