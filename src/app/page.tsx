import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HomeModeHero from "@/components/home/HomeModeHero";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
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
    totalEarned: (u.sellerOrders as Array<{ amount: number }>).reduce((s: number, o: { amount: number }) => s + o.amount, 0),
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
              <span style={{ color: cat.color }}>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
          <Link href="/gigs" className="hero-chip hero-chip-all">
            All categories →
          </Link>
        </div>

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
                  .reduce((s: number, o: { amount: number }) => s + o.amount, 0);
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
                          <span className="stats-row-val">${totalEarned >= 1000 ? `${(totalEarned/1000).toFixed(1)}k` : totalEarned}</span>
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

          <div style={{ display: "grid", gap: "clamp(0.65rem,1.5vw,0.875rem)" }} className="cat-grid">
            {BROWSE_CATEGORIES.map((cat) => {
              const count = categoryCountMap[cat.key] ?? 0;
              return (
                <Link
                  key={cat.label}
                  href={`/gigs?category=${encodeURIComponent(cat.key)}`}
                  style={{
                    display: "flex", flexDirection: "column", gap: 12,
                    padding: "1.1rem 1rem", borderRadius: 14,
                    background: "var(--surface)", border: "1px solid var(--border)",
                    textDecoration: "none", color: "inherit",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
                  }}
                  className="cat-card"
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 2, letterSpacing: "-0.02em" }}>{cat.label}</div>
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
