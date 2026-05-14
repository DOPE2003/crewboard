import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import HomeModeHero from "@/components/home/HomeModeHero";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import HomeModeHIW from "@/components/home/HomeModeHIW";
import HomeFAQ from "@/components/home/HomeFAQ";
import "@/styles/landing.css";

const BROWSE_CATEGORIES = [
  {
    label: "Graphic Design",
    key: "Graphic & Design",
    iconColor: "#e91e8c",
    iconBg: "#fde8f3",
    desc: "Logos, branding & visuals",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z"/>
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
        <path d="M14.5 17.5L4.5 15"/>
      </svg>
    ),
  },
  {
    label: "Web3 Dev",
    key: "Coding & Tech",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
    desc: "Smart contracts & dApps",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5"/>
        <line x1="12" y1="19" x2="20" y2="19"/>
      </svg>
    ),
  },
  {
    label: "Content Creator",
    key: "Content Creator",
    iconColor: "#ea580c",
    iconBg: "#ffedd5",
    desc: "Video, writing & podcasts",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-2a4 4 0 0 1 4-4h3"/>
        <circle cx="8" cy="7" r="4"/>
        <path d="M14 9l7-4v12l-7-4v-4z"/>
      </svg>
    ),
  },
  {
    label: "Social Marketing",
    key: "Social Marketing",
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
    desc: "Growth, KOLs & community",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    label: "Motion Graphic",
    key: "Video & Animation",
    iconColor: "#16a34a",
    iconBg: "#dcfce7",
    desc: "Animations & explainers",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <polygon points="9.5 7.5 16.5 12 9.5 16.5 9.5 7.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: "AI Engineer",
    key: "AI Engineer",
    iconColor: "#ca8a04",
    iconBg: "#fef9c3",
    desc: "LLMs, agents & pipelines",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
        <path d="M20 3v4M22 5h-4"/>
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
      where: {
        twitterHandle: { in: VIDEO_HANDLES },
        profileComplete: true,
        image: { not: null },
      },
      select: {
        twitterHandle: true, name: true, image: true, userTitle: true, bio: true,
        availability: true, skills: true, walletAddress: true, portfolioItems: true,
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
        sellerOrders: { where: { status: "completed" }, select: { id: true, amount: true } },
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
    totalEarned: (u.sellerOrders as Array<{ amount: number }> ?? []).reduce(
      (s: number, o: { amount: number }) => s + (Number(o.amount) || 0), 0
    ),
    memberSince: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  }));

  const handleOrder = Object.fromEntries(VIDEO_HANDLES.map((h, i) => [h, i]));
  const featuredFreelancers = [...rawFeatured].sort(
    (a: any, b: any) => (handleOrder[a.twitterHandle] ?? 99) - (handleOrder[b.twitterHandle] ?? 99)
  );

  return (
    <main className="page landing-page-main">

      {/* ──────────────────────────────── HERO ──────────────────────────────── */}
      <section
        className="landing-hero hero-compact-mobile"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "calc(92vh - 64px)",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1rem, 5vw, 3rem) clamp(4rem, 7vw, 6rem)",
          position: "relative",
          overflow: "hidden",
          background: "var(--surface)",
        }}
      >
        {/* Teal radial glow — top center */}
        <div style={{
          position: "absolute",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(400px, 110vw, 900px)",
          height: "clamp(400px, 70vw, 700px)",
          background: "radial-gradient(ellipse at 50% 30%, rgba(45,212,191,0.32) 0%, rgba(20,184,166,0.14) 40%, rgba(16,185,129,0.05) 65%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />
        {/* Top fade for text readability */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "45%",
          background: "linear-gradient(to bottom, var(--surface) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Floating profile cards — desktop only */}
        {floatingProfiles.length >= 6 && (
          <div
            className="hidden md:block"
            style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <HeroFloatingProfiles profiles={floatingProfiles} />
            </div>
          </div>
        )}

        {/* ── Hero content — center stack ── */}
        <div className="hero-content-stack">
          {/* Beta badge */}
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Now in Beta · Web3 Freelancer Marketplace
          </div>

          {/* Headline + subtitle + CTAs */}
          <HomeModeHero isLoggedIn={isLoggedIn} />

          {/* Category chips */}
          <div
            style={{
              opacity: 0,
              animation: "fadeUp 0.55s 0.8s forwards",
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 600,
              marginTop: "2.5rem",
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {BROWSE_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`/gigs?category=${encodeURIComponent(cat.key)}`}
                className="hero-chip"
              >
                <span style={{ color: cat.iconColor, display: "flex", alignItems: "center" }}>
                  {cat.icon}
                </span>
                {cat.label}
              </Link>
            ))}
            <Link href="/gigs" className="hero-chip hero-chip-all">
              All categories →
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── CATEGORIES ──────────────────────────────── */}
      <section
        id="categories"
        className="page-section page-section-alt"
      >
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Browse by category</h2>
              <p className="section-subtitle">Find the right specialist for your project.</p>
            </div>
            <Link href="/gigs" className="section-see-all">See all services →</Link>
          </div>

          <div className="cat-grid">
            {BROWSE_CATEGORIES.map((cat) => {
              const count = categoryCountMap[cat.key] ?? 0;
              return (
                <Link
                  key={cat.label}
                  href={`/gigs?category=${encodeURIComponent(cat.key)}`}
                  className="cat-card"
                >
                  <div className="cat-icon-wrap" style={{ background: cat.iconBg, color: cat.iconColor }}>
                    {cat.icon}
                  </div>
                  <div className="cat-card-body">
                    <div className="cat-card-label">{cat.label}</div>
                    <div className="cat-card-desc">{cat.desc}</div>
                    <div className="cat-card-count">
                      {count > 0 ? `${count} active gigs` : "Explore"}
                    </div>
                  </div>
                  <div className="cat-card-arrow">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── TOP FREELANCERS ──────────────────────────────── */}
      {featuredFreelancers.length > 0 ? (
        <section className="page-section">
          <div className="section-inner">
            <div className="section-header">
              <div>
                <h2 className="section-title">Top freelancers</h2>
                <p className="section-subtitle">Verified talent ready to work on your project.</p>
              </div>
              <Link href="/talent" className="section-see-all">View all talent →</Link>
            </div>

            <div className="ff-grid">
              {featuredFreelancers.map((f: any) => {
                const minPrice = f.gigs?.[0]?.price ?? null;
                const completedCount = f.sellerOrders?.length ?? 0;
                const isVerified = !!f.walletAddress;
                const toProxy = (url: string) =>
                  url.includes("private.blob.vercel-storage.com")
                    ? `/api/blob/serve?url=${encodeURIComponent(url)}`
                    : url;
                type MediaItem = { type: "image" | "video"; proxyUrl: string };
                const portfolioMedia: MediaItem[] = [
                  ...(Array.isArray(f.portfolioItems) ? f.portfolioItems as any[] : [])
                    .filter((i: any) => i.mediaUrl && i.mediaType === "video")
                    .map((i: any) => ({ type: "video" as const, proxyUrl: toProxy(i.mediaUrl) })),
                  ...(f.showcasePosts ?? [])
                    .filter((p: any) => p.mediaUrl)
                    .map((p: any) => ({
                      type: (p.mediaType === "video" ? "video" : "image") as "video" | "image",
                      proxyUrl: toProxy(p.mediaUrl),
                    })),
                ].slice(0, 1);
                const reviews: { rating: number }[] = f.reviewsReceived ?? [];
                const avgRating =
                  reviews.length > 0
                    ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
                    : null;
                const totalEarned = (f.sellerOrders as Array<{ amount: number }> ?? []).reduce(
                  (s: number, o: { amount: number }) => s + (Number(o.amount) || 0), 0
                );

                return (
                  <div key={f.twitterHandle} className="ff-card">
                    {/* Banner */}
                    <div className="ff-card-banner">
                      {portfolioMedia.length > 0 ? (
                        portfolioMedia[0].type === "video" ? (
                          <video
                            src={portfolioMedia[0].proxyUrl}
                            muted autoPlay loop playsInline
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={portfolioMedia[0].proxyUrl}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        )
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.image}
                          alt=""
                          style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            display: "block", filter: "blur(10px) scale(1.1)", opacity: 0.45,
                          }}
                        />
                      )}
                      {/* Availability dot */}
                      <div className="ff-card-avail-dot" style={{
                        background: f.availability === "available" ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#9ca3af",
                      }} />
                      {avgRating !== null && (
                        <div className="ff-card-rating">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          {avgRating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="ff-card-body">
                      {/* Avatar + name */}
                      <div className="ff-card-avatar-row">
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.image}
                            alt=""
                            className="ff-card-avatar"
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="ff-card-name-row">
                            <span className="ff-card-name">{f.name ?? f.twitterHandle}</span>
                            {isVerified && (
                              <span className="ff-card-verified" aria-label="Verified">
                                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="ff-card-title">{f.userTitle ?? "Freelancer"}</div>
                        </div>
                      </div>

                      {/* X handle */}
                      {f.twitterHandle && (
                        <div className="ff-card-handle">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          @{f.twitterHandle}
                        </div>
                      )}

                      {/* Skills */}
                      {(f.skills as string[] | null)?.length ? (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {(f.skills as string[]).slice(0, 3).map((skill: string) => (
                            <span key={skill} className="skill-chip">{skill}</span>
                          ))}
                        </div>
                      ) : null}

                      {/* Stats */}
                      <div className="stats-row">
                        <div className="stats-row-item">
                          <span className="stats-row-val">
                            {avgRating !== null ? avgRating.toFixed(1) : "—"}
                          </span>
                          <span className="stats-row-label">Rating</span>
                        </div>
                        <div className="stats-row-item">
                          <span className="stats-row-val">
                            {totalEarned >= 1000
                              ? `$${(totalEarned / 1000).toFixed(1)}k`
                              : totalEarned > 0
                              ? `$${totalEarned}`
                              : "—"}
                          </span>
                          <span className="stats-row-label">Earned</span>
                        </div>
                        <div className="stats-row-item">
                          <span className="stats-row-val">{completedCount}</span>
                          <span className="stats-row-label">Orders</span>
                        </div>
                      </div>

                      {/* Price + CTA */}
                      <div className="ff-card-footer">
                        {minPrice != null ? (
                          <span className="ff-card-price">
                            From <strong>${minPrice}</strong>
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link href={`/u/${f.twitterHandle}`} className="card-btn-dark ff-card-cta">
                          View profile
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section className="page-section">
          <div className="section-inner" style={{ textAlign: "center", paddingTop: "3rem", paddingBottom: "3rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No freelancers yet —{" "}
              <Link href="/register" style={{ color: "var(--brand)", fontWeight: 600, textDecoration: "none" }}>
                be the first to join
              </Link>
              .
            </p>
          </div>
        </section>
      )}

      {/* ──────────────────────────────── HOW IT WORKS ──────────────────────────────── */}
      <section id="how-it-works" className="page-section page-section-alt">
        <div className="section-inner">
          <div style={{ textAlign: "center", marginBottom: "clamp(2.25rem, 4.5vw, 3.25rem)" }}>
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle" style={{ marginTop: "0.5rem" }}>
              Fast, secure, and built for Web3 teams.
            </p>
          </div>
          <HomeModeHIW isLoggedIn={isLoggedIn} />
        </div>
      </section>

      {/* ──────────────────────────────── FAQ ──────────────────────────────── */}
      <section id="faq" className="page-section">
        <div className="section-inner" style={{ maxWidth: 740 }}>
          <div style={{ textAlign: "center", marginBottom: "clamp(2.25rem, 4.5vw, 3.25rem)" }}>
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="section-subtitle" style={{ marginTop: "0.5rem" }}>
              Everything you need to know about Crewboard.
            </p>
          </div>
          <HomeFAQ />
          <p style={{
            textAlign: "center",
            marginTop: "2rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}>
            Still have questions?{" "}
            <a
              href="mailto:info@crewboard.com"
              style={{
                color: "var(--brand)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Contact us →
            </a>
          </p>
        </div>
      </section>

      {/* ──────────────────────────────── CTA BANNER ──────────────────────────────── */}
      {!isLoggedIn && (
        <section className="page-section page-section-alt" style={{ overflow: "hidden" }}>
          {/* Background glow */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 65%, rgba(20,184,166,0.13) 0%, transparent 68%)",
            pointerEvents: "none",
          }} />
          <div
            className="section-inner"
            style={{ maxWidth: 640, textAlign: "center", position: "relative" }}
          >
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "0.3rem 1rem",
              borderRadius: 999,
              background: "rgba(20,184,166,0.09)",
              border: "1px solid rgba(20,184,166,0.25)",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: "var(--brand)",
              marginBottom: "1.5rem",
            }}>
              Join the network
            </div>
            <h2
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
                color: "var(--foreground)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginBottom: "1.1rem",
              }}
            >
              Ready to build something{" "}
              <span style={{ color: "var(--brand)" }}>great?</span>
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "1rem",
                lineHeight: 1.7,
                marginBottom: "2.25rem",
                maxWidth: 480,
                margin: "0 auto 2.25rem",
              }}
            >
              Join Crewboard today and connect with the best Web3 talent — or get hired for work you love.
            </p>
            <div className="hero-cta-row" style={{ justifyContent: "center" }}>
              <Link href="/register" className="hero-pill-btn hero-pill-teal" style={{ width: "auto", minWidth: 200 }}>
                Get started — it&apos;s free
              </Link>
              <Link href="/talent" className="hero-pill-btn hero-pill-outline" style={{ width: "auto", minWidth: 160 }}>
                Browse talent
              </Link>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
