import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HomeModeHero from "@/components/home/HomeModeHero";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import HomeModeHIW from "@/components/home/HomeModeHIW";
import "@/styles/landing.css";


const BROWSE_CATEGORIES = [
  {
    label: "Graphic Design", key: "Graphic & Design",
    iconColor: "#e91e8c", iconBg: "#fde8f3",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    ),
  },
  {
    label: "Web3 Dev", key: "Coding & Tech",
    iconColor: "#2563eb", iconBg: "#dbeafe",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    label: "Content Creator", key: "Content Creator",
    iconColor: "#ea580c", iconBg: "#ffedd5",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: "Social Marketing", key: "Social Marketing",
    iconColor: "#7c3aed", iconBg: "#ede9fe",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: "Motion Graphic", key: "Video & Animation",
    iconColor: "#16a34a", iconBg: "#dcfce7",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: "AI Engineer", key: "AI Engineer",
    iconColor: "#ca8a04", iconBg: "#fef9c3",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
      </svg>
    ),
  },
];

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const VIDEO_HANDLES = ["alphaeth", "0xmambich", "mehdi"];

  const [categoryCountsRaw, rawFeatured, rawProfiles] = await Promise.all([
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
    db.user.findMany({
      where: { profileComplete: true, image: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        twitterHandle: true, name: true, image: true, userTitle: true,
        availability: true, skills: true, bio: true, createdAt: true,
        sellerOrders: { where: { status: "completed" }, select: { amount: true } },
      },
    }).catch(() => []),
  ]);
  const categoryCountMap: Record<string, number> = Object.fromEntries(
    categoryCountsRaw.map((c) => [c.category, c._count.id])
  );

  const floatingProfiles = rawProfiles.map((u: any) => ({
    twitterHandle: u.twitterHandle,
    name: u.name,
    image: u.image,
    role: u.userTitle,
    availability: u.availability,
    skills: u.skills ?? [],
    bio: u.bio,
    ordersCompleted: (u.sellerOrders as Array<{ amount: number }> ?? []).length,
    totalEarned: (u.sellerOrders as Array<{ amount: number }> ?? []).reduce((s: number, o: { amount: number }) => s + (Number(o.amount) || 0), 0),
    memberSince: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  }));

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
          padding: "clamp(2.5rem, 5vw, 4.5rem) clamp(1rem, 4vw, 2rem) clamp(3rem, 6vw, 5rem)",
          position: "relative",
          overflow: "visible",
          background: "var(--surface)",
        }}
      >
        {/* Teal radial blob — mimics the iOS app welcome screen */}
        <div style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(320px, 90vw, 720px)",
          height: "clamp(320px, 60vw, 580px)",
          background: "radial-gradient(ellipse at 50% 35%, rgba(45,212,191,0.42) 0%, rgba(20,184,166,0.22) 38%, rgba(16,185,129,0.08) 62%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />
        {/* White fade overlay — keeps text crisp over blob */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "55%",
          background: "linear-gradient(to bottom, var(--surface) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Rotating profile cards — desktop only, 3 left + 3 right */}
        {floatingProfiles.length >= 6 && (
          <div className="hidden md:block" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
            <div style={{ pointerEvents: "auto" }}>
              <HeroFloatingProfiles profiles={floatingProfiles} />
            </div>
          </div>
        )}

        {/* Beta badge */}
        <div
          className="hero-beta-badge"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: "0.7rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "var(--brand)",
            marginTop: "0.25rem",
            marginBottom: "1.4rem",
            padding: "0.3rem 0.9rem",
            border: "1px solid rgba(20,184,166,0.4)",
            borderRadius: "999px",
            background: "rgba(20,184,166,0.08)",
            opacity: 0,
            animation: "fadeUp 0.6s 0.1s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          Now in Beta
        </div>

        {/* Mode-aware hero — headline, subtitle, CTA buttons */}
        <HomeModeHero isLoggedIn={isLoggedIn} />

        {/* ── Category chip strip — mirrors the app's horizontal filter row ── */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.88s forwards",
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 560, marginTop: 28,
          display: "flex", gap: 8, alignItems: "center",
          justifyContent: "center", flexWrap: "wrap",
        }}>
          {BROWSE_CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              href={`/gigs?category=${encodeURIComponent(cat.key)}`}
              className="hero-chip"
              style={{ animationDelay: `${0.88 + i * 0.05}s` }}
            >
              <span style={{ color: cat.iconColor }}>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          <Link href="/gigs" className="hero-chip hero-chip-all">
            All categories →
          </Link>
        </div>

        {/* ── Spotlight cards — Superteam + iOS App ── */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 1.05s forwards",
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 600,
          marginTop: 24,
          display: "flex", gap: 16, alignItems: "stretch",
        }} className="spotlight-row">

          {/* Card 1: Superteam Germany */}
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            overflow: "hidden",
          }}>
            <div style={{ width: 76, flexShrink: 0, overflow: "hidden", background: "#0B0B2E" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://pbs.twimg.com/media/HGfbHMtbQAAGEv1?format=jpg&name=large" alt="Solana Summit Germany" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/superteam-germany.png" alt="Superteam Germany" style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Superteam Germany</span>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <a href="https://x.com/SuperteamDE" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--brand)", textDecoration: "none", fontWeight: 600, marginLeft: "auto", flexShrink: 0 }}>X ↗</a>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                Content Creators Program — Solana Summit Germany
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Exclusive on-site benefits</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>$500 travel boost · Limited spots</div>
                </div>
                <a href="https://t.co/4EFTnBjaWn" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: 6, background: "var(--foreground)", color: "var(--surface)", fontWeight: 700, fontSize: 11, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Apply ↗
                </a>
              </div>
            </div>
          </div>

          {/* Card 2: iOS App Coming Soon */}
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            overflow: "hidden",
          }}>
            <div style={{
              width: 76, flexShrink: 0,
              background: "linear-gradient(160deg, #1c1c1e 0%, #0a0a0a 60%, #0f1520 100%)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <svg width="26" height="32" viewBox="0 0 384 512" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em", textTransform: "uppercase" }}>iOS</span>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
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
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span style={{ marginLeft: "auto", fontSize: 8, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", background: "rgba(20,184,166,0.1)", color: "var(--brand)", padding: "2px 7px", borderRadius: 6, flexShrink: 0, border: "1px solid rgba(20,184,166,0.25)", whiteSpace: "nowrap" }}>Soon</span>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                Crewboard iOS App — Hire &amp; Find Work on the Go
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 6, borderTop: "1px solid var(--border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--brand)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Available on iPhone</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Gigs, escrow &amp; DMs · Launching soon</div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", opacity: 0.5, cursor: "not-allowed", flexShrink: 0 }}>
                  <svg width="9" height="11" viewBox="0 0 384 512" fill="white"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>App Store</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        <style>{`
          @media (max-width: 600px) { .spotlight-row { flex-direction: column !important; } }
        `}</style>

      </div>

      {/* ── FEATURED FREELANCERS ── */}
      {featuredFreelancers.length > 0 && (
        <div style={{ background: "var(--bg-secondary)", padding: "clamp(2.5rem,5vw,3.5rem) 0 clamp(2rem,4vw,3rem)", borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 clamp(1rem,4vw,2rem)" }}>
            {/* Section header — mirrors app's "Top Freelancers · See all" */}
            <div className="section-header">
              <div>
                <h2 className="section-title">Top Freelancers</h2>
                <p className="section-subtitle">Browse verified talent on Crewboard</p>
              </div>
              <Link href="/talent" className="section-see-all">See all →</Link>
            </div>

            <div style={{ display: "grid", gap: "clamp(0.75rem,2vw,1rem)" }} className="ff-grid">
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
                ].slice(0, 1);
                const reviews: { rating: number }[] = f.reviewsReceived ?? [];
                const avgRating = reviews.length > 0
                  ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
                  : null;
                const totalEarned = (f.sellerOrders as Array<{ amount: number }> ?? [])
                  .reduce((s: number, o: { amount: number }) => s + (Number(o.amount) || 0), 0);
                return (
                  <div
                    key={f.twitterHandle}
                    style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 16, overflow: "hidden",
                      display: "flex", flexDirection: "column",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
                    }}
                    className="ff-card"
                  >
                    {/* Portfolio media / avatar banner */}
                    <div style={{ position: "relative", width: "100%", height: 160, background: "#f0f0f2", flexShrink: 0, overflow: "hidden" }}>
                      {portfolioMedia.length > 0 ? (
                        portfolioMedia[0].type === "video" ? (
                          <video
                            src={portfolioMedia[0].proxyUrl}
                            muted autoPlay loop playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={portfolioMedia[0].proxyUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        )
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "blur(8px) scale(1.1)", opacity: 0.6 }} />
                      )}
                      {/* Rating badge overlay — mirrors app */}
                      {avgRating !== null && (
                        <div style={{
                          position: "absolute", bottom: 10, right: 10,
                          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)",
                          borderRadius: 999, padding: "4px 10px",
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, fontWeight: 700, color: "#fff",
                        }}>
                          ⭐ {avgRating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                      {/* Avatar + name row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.image} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", display: "block", border: "2px solid var(--surface)", boxShadow: "0 0 0 1px var(--border)" }} />
                          <span style={{
                            position: "absolute", bottom: 1, right: 1, width: 10, height: 10,
                            borderRadius: "50%", border: "2px solid var(--surface)",
                            background: f.availability === "available" ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#d1d5db",
                          }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                              {f.name ?? f.twitterHandle}
                            </span>
                            {isVerified && (
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.userTitle ?? "Freelancer"}
                          </div>
                        </div>
                      </div>

                      {/* X handle */}
                      {f.twitterHandle && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, opacity: 0.65 }}>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          @{f.twitterHandle}
                        </div>
                      )}

                      {/* Skill chips */}
                      {(f.skills as string[] | null)?.length ? (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {(f.skills as string[]).slice(0, 3).map((skill: string) => (
                            <span key={skill} className="skill-chip">{skill}</span>
                          ))}
                        </div>
                      ) : null}

                      {/* Stats row — mirrors app (Rating | Earned | Orders) */}
                      <div className="stats-row">
                        <div className="stats-row-item">
                          <span className="stats-row-val">{avgRating !== null ? `⭐ ${avgRating.toFixed(1)}` : "New"}</span>
                          <span className="stats-row-label">Rating</span>
                        </div>
                        <div className="stats-row-item">
                          <span className="stats-row-val">${totalEarned >= 1000 ? `${(totalEarned/1000).toFixed(1)}k` : totalEarned > 0 ? totalEarned : "—"}</span>
                          <span className="stats-row-label">Earned</span>
                        </div>
                        <div className="stats-row-item">
                          <span className="stats-row-val">{completedCount}</span>
                          <span className="stats-row-label">Orders</span>
                        </div>
                      </div>

                      {/* From price */}
                      {minPrice != null && (
                        <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                          From <span style={{ color: "var(--foreground)", fontWeight: 700 }}>${minPrice}</span>
                        </div>
                      )}

                      {/* CTA button — mirrors app's "Show Portfolio" black pill */}
                      <Link href={`/u/${f.twitterHandle}`} className="card-btn-dark" style={{ marginTop: "auto" }}>
                        View Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <style>{`
            .ff-grid { grid-template-columns: repeat(3,1fr); }
            @media (max-width: 900px) { .ff-grid { grid-template-columns: repeat(2,1fr); } }
            @media (max-width: 500px) { .ff-grid { grid-template-columns: 1fr; } }
            .ff-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 36px rgba(0,0,0,0.10) !important;
              border-color: rgba(20,184,166,0.3) !important;
            }
          `}</style>
        </div>
      )}

      {featuredFreelancers.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem", borderTop: "1px solid var(--card-border)" }}>
          No freelancers yet — <Link href="/register" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>be the first to join</Link>.
        </div>
      )}

      {/* ── BROWSE BY CATEGORY ── */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "clamp(2.5rem,5vw,3.5rem) clamp(1rem,4vw,2rem)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-subtitle">Find the right specialist fast.</p>
            </div>
            <Link href="/gigs" className="section-see-all">See all →</Link>
          </div>

          <div style={{ display: "grid", gap: "clamp(0.75rem,1.5vw,1rem)" }} className="cat-grid">
            {BROWSE_CATEGORIES.map((cat) => {
              const count = categoryCountMap[cat.key] ?? 0;
              return (
                <Link
                  key={cat.label}
                  href={`/gigs?category=${encodeURIComponent(cat.key)}`}
                  style={{
                    display: "flex", flexDirection: "row", alignItems: "center", gap: 14,
                    padding: "1rem 1.1rem", borderRadius: 16,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    textDecoration: "none", color: "inherit",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
                  }}
                  className="cat-card"
                >
                  {/* Circular pastel icon — matches iOS app exactly */}
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                    background: cat.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: cat.iconColor,
                  }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 3, letterSpacing: "-0.02em" }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                      {count > 0 ? `${count}+ Talents` : "Explore"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <style>{`
          .cat-grid { grid-template-columns: repeat(3,1fr); }
          @media (max-width: 900px) { .cat-grid { grid-template-columns: repeat(2,1fr); } }
          @media (max-width: 480px) { .cat-grid { grid-template-columns: 1fr; } }
          .cat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
            border-color: rgba(20,184,166,0.35) !important;
          }
        `}</style>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ padding: "clamp(3rem,6vw,5rem) clamp(1rem,4vw,2rem)", background: "var(--bg-secondary)", borderTop: "1px solid var(--border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,3.2vw,2.25rem)", color: "var(--foreground)", margin: "0 0 0.5rem", letterSpacing: "-0.04em" }}>
              How it works
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>Fast, secure, and built for Web3 teams.</p>
          </div>

          <HomeModeHIW isLoggedIn={isLoggedIn} />
        </div>
      </div>

    </main>
    </>
  );
}
