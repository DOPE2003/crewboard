import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import HomeModeHero from "@/components/home/HomeModeHero";
import HomeModeHIW from "@/components/home/HomeModeHIW";
import "@/styles/landing.css";


const BROWSE_CATEGORIES = [
  { label: "Graphic Design", key: "Graphic & Design", color: "#f59e0b", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
  )},
  { label: "Web3 Dev", key: "Coding & Tech", color: "#6366f1", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  )},
  { label: "Content", key: "Content Creator", color: "var(--brand)", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  )},
  { label: "Social", key: "Social Marketing", color: "#ec4899", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { label: "Motion", key: "Video & Animation", color: "#f97316", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
  )},
  { label: "AI Engineer", key: "AI Engineer", color: "#8b5cf6", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
  )},
];

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

  const VIDEO_HANDLES = ["alphaeth", "0xmambich", "mehdi"];

  const [categoryCountsRaw, rawFeatured] = await Promise.all([
    db.gig.groupBy({
      by: ["category"],
      where: { status: "active" },
      _count: { id: true },
    }).catch(() => [] as Array<{ category: string; _count: { id: number } }>),
    db.user.findMany({
      where: { twitterHandle: { in: VIDEO_HANDLES }, profileComplete: true, image: { not: null } },
      select: {
        twitterHandle: true, name: true, image: true, userTitle: true, bio: true,
        availability: true, skills: true, lastSeenAt: true, walletAddress: true,
        portfolioItems: true,
        gigs: {
          where: { status: "active" },
          select: { price: true, image: true, title: true },
          orderBy: { price: "asc" },
          take: 3,
        },
        showcasePosts: {
          where: { NOT: { mediaUrl: "" } },
          select: { mediaUrl: true, mediaType: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        sellerOrders: { where: { status: "completed" }, select: { id: true } },
        reviewsReceived: { select: { rating: true } },
      },
    }).catch(() => []),
  ]);
  const categoryCountMap: Record<string, number> = Object.fromEntries(
    categoryCountsRaw.map((c) => [c.category, c._count.id])
  );

  const handleOrder = Object.fromEntries(VIDEO_HANDLES.map((h, i) => [h, i]));
  const featuredFreelancers = [...rawFeatured].sort(
    (a: any, b: any) => (handleOrder[a.twitterHandle] ?? 99) - (handleOrder[b.twitterHandle] ?? 99)
  );

  return (
    <>
    <main className="page landing-page-main">

      {/* ── HERO ── */}
      <div
        className="landing-hero hero-compact-mobile"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "center",
          padding: "clamp(2rem, 4vw, 3.5rem) clamp(1rem, 4vw, 2rem) clamp(2.5rem, 5vw, 4rem)",
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
            color: "var(--brand-dark)",
            marginTop: "0.5rem",
            marginBottom: "1.5rem",
            padding: "0.35rem 0.85rem",
            border: "1px solid var(--brand)",
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

        {/* Mode-aware hero — headline, subtitle, CTA cards */}
        <HomeModeHero isLoggedIn={isLoggedIn} />

        {/* ── Spotlight cards row — inside hero ── */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.9s forwards",
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 520,
          display: "flex", gap: 12, alignItems: "stretch",
        }} className="eco-highlights-row">

          {/* Card 1: Superteam */}
          <div className="eco-hero-card" style={{
            flex: 1, minWidth: 0,
            display: "flex", borderRadius: 12,
            border: "1px solid rgba(20,184,166,0.2)",
            background: "var(--card-bg)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            overflow: "hidden", textAlign: "left",
          }}>
            <div style={{ width: 80, flexShrink: 0, overflow: "hidden", background: "#0B0B2E" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://pbs.twimg.com/media/HGfbHMtbQAAGEv1?format=jpg&name=large" alt="Solana Summit Germany" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, gap: 6, textAlign: "left" }}>
              {/* Publisher row */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", minWidth: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/superteam-germany.png" alt="Superteam Germany" style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Superteam Germany</span>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <a href="https://x.com/SuperteamDE" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--brand)", textDecoration: "none", fontWeight: 600, marginLeft: "auto", flexShrink: 0, whiteSpace: "nowrap" }}>X ↗</a>
              </div>
              {/* Title */}
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.3, letterSpacing: "-0.01em", textAlign: "left" }}>
                Content Creators Program — Solana Summit Germany
              </div>
              {/* Benefit + CTA */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 6, borderTop: "1px solid var(--card-border)" }}>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--brand)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Exclusive on-site benefits</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>$500 travel boost · Limited spots</div>
                </div>
                <a href="https://t.co/4EFTnBjaWn" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 6, background: "var(--foreground)", color: "var(--dropdown-bg)", fontWeight: 700, fontSize: 11, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Apply ↗
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: iOS App Coming Soon */}
          <div className="eco-hero-card" style={{
            flex: 1, minWidth: 0,
            display: "flex", borderRadius: 12,
            border: "1px solid rgba(20,184,166,0.2)",
            background: "var(--card-bg)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            overflow: "hidden", textAlign: "left",
          }}>
            {/* Apple logo strip */}
            <div style={{
              width: 80, flexShrink: 0,
              background: "linear-gradient(160deg, #1c1c1e 0%, #0a0a0a 60%, #0f1520 100%)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <svg width="28" height="34" viewBox="0 0 384 512" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>iOS</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, gap: 6, textAlign: "left" }}>
              {/* Publisher row */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", minWidth: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ width: 14, height: 14, flexShrink: 0 }}>
                  <polygon points="44,24 34,6.7 14,6.7 4,24 14,41.3 34,41.3" fill="none" stroke="var(--foreground)" strokeWidth="3.5" strokeLinejoin="round"/>
                  <line x1="24" y1="13" x2="14.5" y2="29.5" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="24" y1="13" x2="33.5" y2="29.5" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="14.5" y1="29.5" x2="33.5" y2="29.5" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="24" cy="13" r="3.5" fill="var(--foreground)"/>
                  <circle cx="14.5" cy="29.5" r="3.5" fill="var(--foreground)"/>
                  <circle cx="33.5" cy="29.5" r="3.5" fill="var(--foreground)"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Crewboard</span>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", background: "rgba(20,184,166,0.12)", color: "var(--brand)", padding: "2px 6px", borderRadius: 99, flexShrink: 0, border: "1px solid rgba(20,184,166,0.25)", whiteSpace: "nowrap" }}>Soon</span>
              </div>
              {/* Title */}
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.3, letterSpacing: "-0.01em", textAlign: "left" }}>
                Crewboard iOS App — Hire &amp; Find Work on the Go
              </div>
              {/* Benefit + App Store */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 6, borderTop: "1px solid var(--card-border)" }}>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--brand)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Available on iPhone</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Gigs, escrow &amp; DMs · Launching soon</div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", opacity: 0.55, cursor: "not-allowed", flexShrink: 0 }}>
                  <svg width="9" height="11" viewBox="0 0 384 512" fill="white"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>App Store</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @media (max-width: 560px) {
          .eco-hero-card { flex-direction: column !important; }
          .eco-hero-card > div:first-child { width: 100% !important; height: 110px; }
        }
        @media (max-width: 720px) {
          .eco-highlights-row { flex-direction: column !important; }
        }
      `}</style>

      {/* ── FEATURED FREELANCERS ── */}
      {featuredFreelancers.length > 0 && (
        <div style={{ background: "var(--background)", padding: "clamp(2.5rem,5vw,3.5rem) 0 clamp(1.5rem,4vw,2.5rem)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 clamp(1rem,4vw,2rem)" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "clamp(1.5rem,3vw,2rem)" }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--brand)", marginBottom: "0.4rem" }}>
                  Creator showcase
                </div>
                <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.3rem,2.8vw,1.75rem)", color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Top video creators
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
                  Real portfolio videos from verified talent on Crewboard
                </p>
              </div>
              <Link href="/talent" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                Browse all →
              </Link>
            </div>
            <div style={{ display: "grid", gap: "clamp(0.75rem,2vw,1.25rem)" }} className="ff-grid">
              {featuredFreelancers.map((f: any) => {
                const minPrice = f.gigs?.[0]?.price ?? null;
                const completedCount = f.sellerOrders?.length ?? 0;
                const isVerified = !!f.walletAddress;
                type MediaItem = { type: "image" | "video"; url: string; proxyUrl: string };
                const toProxy = (url: string) =>
                  url.includes("private.blob.vercel-storage.com")
                    ? `/api/blob/serve?url=${encodeURIComponent(url)}`
                    : url;
                const portfolioMedia: MediaItem[] = [
                  ...(Array.isArray(f.portfolioItems) ? f.portfolioItems as any[] : [])
                    .filter((i: any) => i.mediaUrl && i.mediaType === "video")
                    .map((i: any) => ({ type: "video" as const, url: i.mediaUrl as string, proxyUrl: toProxy(i.mediaUrl) })),
                  ...(f.showcasePosts ?? [] as any[])
                    .filter((p: any) => p.mediaUrl)
                    .map((p: any) => ({ type: p.mediaType === "video" ? "video" as const : "image" as const, url: p.mediaUrl as string, proxyUrl: toProxy(p.mediaUrl) })),
                ].slice(0, 2);
                const cardGigs = (f.gigs ?? []) as Array<{ price: number; title: string }>;
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
                          background: f.availability === "available" ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#94a3b8",
                        }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1, paddingTop: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name ?? f.twitterHandle}
                          </span>
                          {isVerified && (
                            <span className="cbadge-wrap" style={{ flexShrink: 0 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", background: "var(--brand)" }}>
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

                    {/* Portfolio media or services */}
                    {portfolioMedia.length > 0 ? (
                      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                        {portfolioMedia.map((item, j) =>
                          item.type === "video" ? (
                            <video
                              key={j}
                              src={item.proxyUrl}
                              muted
                              autoPlay
                              loop
                              playsInline
                              style={{ flex: 1, minWidth: 0, height: 110, objectFit: "cover", display: "block", borderRadius: 7 }}
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={j} src={item.proxyUrl} alt="" style={{ flex: 1, minWidth: 0, height: 110, objectFit: "cover", display: "block", borderRadius: 7 }} />
                          )
                        )}
                      </div>
                    ) : cardGigs.length > 0 ? (
                      <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 4 }}>
                        {cardGigs.map((g, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 7, background: "var(--background)", border: "1px solid var(--card-border)" }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{g.title}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", flexShrink: 0 }}>${g.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Price footer */}
                    <div style={{ marginTop: "auto", borderTop: "1px solid var(--card-border)", paddingTop: 9, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand)", letterSpacing: "-0.01em" }}>
                          From ${minPrice != null ? minPrice : 50}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>/ project</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)", whiteSpace: "nowrap" }}>
                        View profile →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

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

      {featuredFreelancers.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem", borderTop: "1px solid var(--card-border)" }}>
          No freelancers yet — <Link href="/register" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>be the first to join</Link>.
        </div>
      )}

      {/* ── BROWSE BY CATEGORY ── */}
      <div style={{ background: "var(--card-bg)", borderTop: "1px solid var(--card-border)", padding: "clamp(2.5rem,5vw,3.5rem) clamp(1rem,4vw,2rem)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "clamp(1.5rem,3vw,2rem)" }}>
            <div>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.3rem,2.8vw,1.75rem)", color: "var(--foreground)", margin: "0 0 0.25rem", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Browse by Category
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: 0 }}>Find the right specialist fast.</p>
            </div>
            <Link href="/gigs" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              See all →
            </Link>
          </div>

          <div style={{ display: "grid", gap: "clamp(0.65rem,1.5vw,1rem)" }} className="cat-grid">
            {BROWSE_CATEGORIES.map((cat) => {
              const count = categoryCountMap[cat.key] ?? 0;
              return (
                <Link
                  key={cat.label}
                  href={`/gigs?category=${encodeURIComponent(cat.key)}`}
                  style={{
                    display: "flex", flexDirection: "column", gap: 10,
                    padding: "1rem 1.1rem", borderRadius: 14,
                    background: "var(--background)", border: "1px solid var(--card-border)",
                    textDecoration: "none", color: "inherit",
                    transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
                  }}
                  className="cat-card"
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat.color}1a`, border: `1px solid ${cat.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 3, letterSpacing: "-0.01em" }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{count > 0 ? `${count} gigs` : "Explore"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <style>{`
          .cat-grid { grid-template-columns: repeat(6,1fr); }
          @media (max-width: 900px) { .cat-grid { grid-template-columns: repeat(3,1fr); } }
          @media (max-width: 500px) { .cat-grid { grid-template-columns: repeat(2,1fr); } }
          .cat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
            border-color: rgba(20,184,166,0.35) !important;
          }
        `}</style>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ padding: "clamp(3rem,6vw,5rem) clamp(1rem,4vw,2rem)", background: "var(--card-bg)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--brand)", marginBottom: "0.6rem" }}>
              Simple Process
            </div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3.2vw,2.2rem)", color: "var(--foreground)", margin: "0 0 0.55rem", letterSpacing: "-0.03em" }}>
              Get work done in 3 simple steps
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>Fast, secure, and built for Web3 teams.</p>
          </div>

          {/* Mode-aware steps + bottom CTA */}
          <HomeModeHIW isLoggedIn={isLoggedIn} />
        </div>
      </div>

    </main>
    </>
  );
}
