import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HeroMobileSearch from "@/components/home/HeroMobileSearch";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import "@/styles/landing.css";

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "Escrow Smart Contracts",
    desc: "Payments are held in automated smart contracts and released only on delivery. Zero counterparty risk.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: "Instant Crypto Payouts",
    desc: "Get paid in SOL, USDC, or any token. No banks, no delays, no fees eating your earnings.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z"/>
      </svg>
    ),
    title: "On-Chain Reputation",
    desc: "Your track record lives on the blockchain — immutable, portable, and owned by you, not the platform.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: "Multi-Chain Support",
    desc: "Deploy and collaborate across Ethereum, Polygon, Arbitrum, Solana. One profile, every chain.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20M6 20V10l6-8 6 8v10"/>
      </svg>
    ),
    title: "DAO Governance",
    desc: "Token holders decide fees, features, and upgrades. The platform is built and owned by the community.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
    title: "Verified Credentials",
    desc: "NFT-based skill certificates verify your expertise on-chain. Prove what you know, not just what you claim.",
  },
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const rawProfiles = await db.user.findMany({
    where: { profileComplete: true, image: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      twitterHandle: true, name: true, image: true, role: true,
      availability: true, skills: true, bio: true, createdAt: true,
      sellerOrders: { where: { status: "completed" }, select: { amount: true } },
    },
  }).catch(() => []);

  const floatingProfiles = rawProfiles.map((u: any) => ({
    twitterHandle: u.twitterHandle,
    name: u.name,
    image: u.image,
    role: u.role,
    availability: u.availability,
    skills: u.skills,
    bio: u.bio,
    ordersCompleted: (u.sellerOrders as Array<{ amount: number }> ?? []).length,
    totalEarned: (u.sellerOrders as Array<{ amount: number }>).reduce((s: number, o: { amount: number }) => s + o.amount, 0),
    memberSince: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  }));

  return (
    <main className="page landing-page-main">

      {/* ── HERO ── */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "center",
        padding: "clamp(2rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 5vw, 4rem)",
        position: "relative",
        overflow: "hidden",
      }} className="landing-hero">

        {/* Glow — centered behind headline */}
        <div style={{
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

        {/* Floating profile cards */}
        {floatingProfiles.length >= 2 && (
          <HeroFloatingProfiles profiles={floatingProfiles} />
        )}

        {/* Status chip */}
        <div style={{
          fontFamily: "Space Mono, monospace",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.28em",
          color: "#22c55e",
          textTransform: "uppercase",
          marginBottom: "2rem",
          padding: "0.45rem 1rem",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "999px",
          background: "rgba(34,197,94,0.05)",
          opacity: 0,
          animation: "fadeUp 0.6s 0.1s forwards",
        }}>
          ✦ Now in Beta
        </div>
        {/* Headline */}
        <h1 className="hero-h1" style={{
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.01em",
          lineHeight: 0.93,
          marginBottom: "1.5rem",
          color: "var(--foreground)",
          opacity: 0,
          animation: "fadeUp 0.6s 0.25s forwards",
          position: "relative",
          zIndex: 1,
        }}>
          Hire your next<br />
          Web3 <span style={{ color: "#2DD4BF" }}>freelancer.</span>
        </h1>

        {/* Small sign-in button */}
        {!isLoggedIn && (
          <Link href="/register" style={{
            display: "inline-flex",
            alignItems: "center",
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#fff",
            textDecoration: "none",
            padding: "0.7rem 1.75rem",
            borderRadius: "999px",
            border: "1.5px solid #000",
            background: "#000",
            marginBottom: "2.5rem",
            opacity: 0,
            animation: "fadeUp 0.6s 0.38s forwards",
            position: "relative",
            zIndex: 1,
            transition: "background 0.18s, border-color 0.18s, color 0.18s",
          }}>
            Join Crewboard
          </Link>
        )}
        {isLoggedIn && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.3rem",
            marginBottom: "2.5rem",
            opacity: 0,
            animation: "fadeUp 0.6s 0.38s forwards",
            position: "relative",
            zIndex: 1,
          }}>
            <span style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              Welcome back
            </span>
            <span style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3rem)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
              color: "var(--foreground)",
            }}>
              {session?.user?.name?.split(" ")[0] ?? (session?.user as any)?.twitterHandle ?? "Builder"}
            </span>
          </div>
        )}


        {/* Subtitle */}
        <p style={{
          color: "var(--text-muted)",
          fontSize: "0.88rem",
          lineHeight: 1.85,
          maxWidth: "22rem",
          letterSpacing: "0.01em",
          marginBottom: "2rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.58s forwards",
          position: "relative",
          zIndex: 1,
        }}>
          Connect with builders. Ship real products.<br />
          The professional network Web3 deserves.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: "flex",
          gap: "0.85rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "3rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.66s forwards",
          position: "relative",
          zIndex: 1,
        }}>
          <Link href="/talent" className="btn-hero-primary">
            Browse Talent
          </Link>
          <Link href={isLoggedIn ? "/gigs/new" : "/register"} className="btn-hero-secondary">
            {isLoggedIn ? "Post a Service" : "Join as Freelancer"}
          </Link>
        </div>

        {/* Mobile search bar — hidden on desktop */}
        <div style={{ opacity: 0, animation: "fadeUp 0.6s 0.62s forwards", width: "100%", maxWidth: "min(100%, 400px)" }}>
          <HeroMobileSearch />
        </div>

        {/* Stats + scroll */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          opacity: 0,
          animation: "fadeUp 0.6s 0.7s forwards",
          position: "relative",
          zIndex: 1,
        }}>

          <span style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.52rem",
            letterSpacing: "0.25em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>Scroll</span>
          <div className="scroll-line" />
        </div>
      </div>


      {/* ── TRUST STRIP ── */}
      <div style={{ borderTop: "1px solid var(--card-border)", borderBottom: "1px solid var(--card-border)", padding: "1.5rem 1.25rem", background: "var(--card-bg)", position: "relative", zIndex: 1 }}>
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
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "var(--foreground)", letterSpacing: "0.02em" }}>{item.label}</div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 1 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="landing-section" style={{ padding: "clamp(2.5rem, 6vw, 5rem) clamp(1rem, 4vw, 2rem)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div className="section-label">Simple Process</div>
          <h2 style={{
            fontFamily: "Rajdhani, sans-serif",
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
            From signing up to shipping your first project — here's the full journey on Crewboard.
          </p>

          <div className="landing-steps-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1.25rem",
          }}>
            {[
              {
                step: "01",
                title: "Connect your X account",
                desc: "Sign in with Twitter/X in one click. No forms, no passwords — your Web3 identity starts here.",
                tag: "Sign up",
              },
              {
                step: "02",
                title: "Build your profile",
                desc: "Choose your role, add your skills, and write a short bio. Your profile is your on-chain resume.",
                tag: "Identity",
              },
              {
                step: "03",
                title: "Browse the talent pool",
                desc: "Search and filter builders by role, skill, chain, and availability. Find exactly who you need.",
                tag: "Discover",
              },
              {
                step: "04",
                title: "Post or join a project",
                desc: "Founders post projects with roles needed. Builders apply directly — no middlemen, no agencies.",
                tag: "Collaborate",
              },
              {
                step: "05",
                title: "Communicate in-platform",
                desc: "All coordination happens inside Crewboard. No DMs scattered across Discord, Telegram, or X.",
                tag: "Communicate",
              },
              {
                step: "06",
                title: "Ship & build reputation",
                desc: "Completed work builds your track record. Every project adds to your verifiable on-chain history.",
                tag: "Grow",
              },
            ].map((item) => (
              <div key={item.step} style={{
                padding: "1.75rem",
                borderRadius: 16,
                border: "1px solid var(--card-border)",
                background: "rgba(var(--foreground-rgb), 0.015)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}>
                {/* Step number + tag row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <div style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.6rem",
                    letterSpacing: "0.22em",
                    color: "#2DD4BF",
                    fontWeight: 700,
                  }}>
                    {item.step}
                  </div>
                  <span style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: "0.5rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(0,0,0,0.35)",
                    background: "rgba(0,0,0,0.05)",
                    padding: "0.2rem 0.55rem",
                    borderRadius: 999,
                  }}>
                    {item.tag}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "0.02em",
                  color: "var(--foreground)",
                  lineHeight: 1.2,
                }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="landing-section" style={{ padding: "clamp(2.5rem, 7vw, 6rem) clamp(1rem, 4vw, 2rem)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <div className="section-label">Platform Features</div>
          <h2 style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            color: "var(--foreground)",
            marginBottom: "3.5rem",
            lineHeight: 1.15,
          }}>
            Built different.<br />
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              Built for Web3.
            </span>
          </h2>

          <div className="landing-features-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                padding: "1.75rem",
                borderRadius: 16,
                border: "1px solid var(--card-border)",
                background: "rgba(var(--foreground-rgb), 0.02)",
                transition: "border-color 0.2s, background 0.2s",
              }}>
                <div style={{ color: "#2DD4BF", marginBottom: "1rem", lineHeight: 1 }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  letterSpacing: "0.02em",
                  color: "var(--foreground)",
                  marginBottom: "0.5rem",
                }}>
                  {f.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
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
            {/* subtle teal glow */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "60%",
              height: "60%",
              background: "radial-gradient(ellipse, rgba(20,184,166,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div className="section-label" style={{ width: "fit-content", margin: "0 auto" }}>Join the Crew</div>
            <h2 style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "var(--foreground)",
              margin: "1rem 0",
            }}>
              Ready to build with the best?
            </h2>
            <p style={{
              color: "var(--text-muted)",
              fontSize: "1rem",
              lineHeight: 1.7,
              maxWidth: "32rem",
              margin: "0 auto 2.5rem",
            }}>
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
