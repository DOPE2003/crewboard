import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { startConversation, hireFromGig } from "@/actions/messages";
import GigOwnerActions from "./GigOwnerActions";
import ActionButton from "@/components/ui/ActionButton";

function formatPrice(price: number): string {
  if (price >= 1000000) return "$" + (price / 1000000).toFixed(1) + "m";
  if (price >= 1000) return "$" + price.toLocaleString();
  return "$" + price;
}

export default async function GigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [gig, session] = await Promise.all([
    db.gig.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            twitterHandle: true,
            image: true,
            userTitle: true,
            bio: true,
            skills: true,
            createdAt: true,
          },
        },
      },
    }),
    auth(),
  ]);

  if (!gig || gig.status !== "active") notFound();

  const viewerId = (session?.user as any)?.userId as string | undefined;
  const isOwner = viewerId === gig.userId;
  const canHire = !!viewerId && !isOwner;

  const [reviewAgg, completedCount, reviews] = await Promise.all([
    db.review.aggregate({
      where: { revieweeId: gig.userId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    db.order.count({ where: { sellerId: gig.userId, status: "completed" } }),
    db.review.findMany({
      where: { revieweeId: gig.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        reviewer: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  const avgRating = reviewAgg._avg.rating;
  const reviewCount = reviewAgg._count.rating;

  const sellerName = gig.user.name ?? gig.user.twitterHandle;
  const sellerInitials = sellerName.slice(0, 2).toUpperCase();
  const memberSince = new Date(gig.user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <main className="page">
      <div className="gd-wrap">

        {/* Breadcrumb */}
        <nav className="gd-breadcrumb">
          <Link href="/gigs" className="gd-breadcrumb-link">← All Gigs</Link>
          <span className="gd-breadcrumb-sep">/</span>
          <Link href={`/gigs?category=${encodeURIComponent(gig.category)}`} className="gd-breadcrumb-link">
            {gig.category}
          </Link>
        </nav>

        <div className="gd-layout">

          {/* LEFT: Gig details */}
          <div className="gd-main">
            <span className="gig-category-badge" style={{ marginBottom: "0.75rem", display: "inline-block" }}>{gig.category}</span>
            <h1 className="gd-title">{gig.title}</h1>

            {/* Stats row */}
            <div className="gd-stats-row">
              {avgRating !== null && (
                <div className="gd-stat-item">
                  <span style={{ color: "#f59e0b" }}>★</span>
                  <span className="gd-stat-val">{avgRating.toFixed(1)}</span>
                  <span className="gd-stat-count">({reviewCount})</span>
                </div>
              )}
              <div className="gd-stat-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                {completedCount} completed
              </div>
              <div className="gd-stat-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {gig.deliveryDays}d delivery
              </div>
            </div>

            {/* Description */}
            <div className="gd-section">
              <div className="gd-section-label">ABOUT THIS GIG</div>
              <p className="gd-description">{gig.description}</p>
            </div>

            {/* Tags */}
            {gig.tags.length > 0 && (
              <div className="gd-tags">
                {gig.tags.map((t) => (
                  <span key={t} className="dash-skill-chip">{t}</span>
                ))}
              </div>
            )}

            {/* Seller */}
            <div className="gd-section">
              <div className="gd-section-label">ABOUT THE SELLER</div>
              <div className="gd-seller-card">
                <Link href={`/u/${gig.user.twitterHandle}`} className="gd-seller-top">
                  <div className="gd-seller-avatar-wrap">
                    {gig.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={gig.user.image} alt="" className="gd-seller-avatar" />
                    ) : (
                      <div className="gd-seller-avatar-fallback">{sellerInitials}</div>
                    )}
                  </div>
                  <div className="gd-seller-meta">
                    <div className="gd-seller-name">{sellerName}</div>
                    <div className="gd-seller-handle">@{gig.user.twitterHandle}</div>
                    {gig.user.userTitle && <div className="gd-seller-role">{gig.user.userTitle}</div>}
                  </div>
                </Link>
                {gig.user.bio && <p className="gd-seller-bio">{gig.user.bio}</p>}
                {gig.user.skills.length > 0 && (
                  <div className="gd-seller-skills">
                    {gig.user.skills.slice(0, 6).map((s) => (
                      <span key={s} className="dash-skill-chip">{s}</span>
                    ))}
                  </div>
                )}
                {/* FIX 6 — Seller stats */}
                <div className="gd-seller-stats">
                  {completedCount} order{completedCount !== 1 ? "s" : ""} completed · Member since {memberSince}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="gd-section">
                <div className="gd-section-label">REVIEWS ({reviewCount})</div>
                <div className="gd-reviews">
                  {reviews.map((r) => {
                    const rName = r.reviewer.name ?? r.reviewer.twitterHandle;
                    const rInitials = rName.slice(0, 2).toUpperCase();
                    const rDate = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    return (
                      <div key={r.id} className="gd-review">
                        <div className="gd-review-header">
                          {/* FIX 3 — reviewer avatar with real photo */}
                          <div className="gd-review-avatar-wrap">
                            {r.reviewer.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.reviewer.image} alt="" className="gd-review-avatar" />
                            ) : (
                              <div className="gd-review-avatar-fallback">{rInitials}</div>
                            )}
                          </div>
                          <div className="gd-review-info">
                            <div className="gd-review-author">{rName}</div>
                            <div className="gd-review-date">{rDate}</div>
                          </div>
                          <div className="gd-review-stars">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <span key={i} style={{ color: i <= r.rating ? "#f59e0b" : "var(--card-border)" }}>★</span>
                            ))}
                          </div>
                        </div>
                        {r.body && <p className="gd-review-body">{r.body}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sticky hire card */}
          <aside className="gd-aside">
            <div className="gd-hire-card">
              <div className="gd-hire-price-row">
                <div>
                  <div className="gd-hire-price-label">Starting at</div>
                  {/* FIX 2 — formatted price */}
                  <div className="gd-hire-price">{formatPrice(gig.price)}</div>
                </div>
                {avgRating !== null && (
                  <div className="gd-hire-rating">
                    <span style={{ color: "#f59e0b" }}>★</span>
                    <span>{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="gd-hire-meta">
                <div className="gd-hire-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {gig.deliveryDays} day{gig.deliveryDays !== 1 ? "s" : ""} delivery
                </div>
                <div className="gd-hire-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  {completedCount} order{completedCount !== 1 ? "s" : ""} completed
                </div>
              </div>

              {canHire && (
                <div className="gd-hire-actions">
                  {/* How hiring works mini-explainer */}
                  <div style={{ marginBottom: "0.85rem", padding: "0.75rem", borderRadius: 10, background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.5rem" }}>How it works</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {([
                        { step: "1", text: "Message to discuss details" },
                        { step: "2", text: "Send & accept a formal offer" },
                        { step: "3", text: "Fund escrow — payment is secured" },
                        { step: "4", text: "Freelancer delivers, you release funds" },
                      ] as { step: string; text: string }[]).map((s) => (
                        <div key={s.step} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(20,184,166,0.15)", color: "#14b8a6", fontSize: "0.55rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.step}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ActionButton
                    action={hireFromGig.bind(null, gig.id, gig.userId)}
                    className="gd-hire-btn gd-hire-btn--primary"
                  >
                    Hire Now
                  </ActionButton>
                  <ActionButton
                    action={startConversation.bind(null, gig.userId)}
                    className="gd-msg-btn"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Send Message
                  </ActionButton>
                </div>
              )}

              {isOwner && (
                <div className="gd-hire-actions">
                  <GigOwnerActions gigId={gig.id} currentStatus={gig.status} />
                </div>
              )}

              {!viewerId && (
                <div className="gd-hire-actions">
                  <div style={{ marginBottom: "0.85rem", padding: "0.75rem", borderRadius: 10, background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.5rem" }}>How it works</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {([
                        { step: "1", text: "Sign in with X (Twitter)" },
                        { step: "2", text: "Message to discuss details" },
                        { step: "3", text: "Send & accept a formal offer" },
                        { step: "4", text: "Pay via on-chain escrow — funds held safely until delivery" },
                      ] as { step: string; text: string }[]).map((s) => (
                        <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(20,184,166,0.15)", color: "#14b8a6", fontSize: "0.55rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{s.step}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/login?callbackUrl=/gigs/${id}`}
                    className="gd-hire-btn gd-hire-btn--primary"
                    style={{ textAlign: "center" }}
                  >
                    Sign in to hire
                  </Link>
                  <p style={{ margin: "0.6rem 0 0", fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                    Free to join · Web3 professionals only
                  </p>
                </div>
              )}

              {/* FIX 4 — Honest trust badges */}
              <div className="gd-trust">
                <div className="gd-trust-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Escrow payments — coming soon
                </div>
                <div className="gd-trust-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Vetted Web3 professional
                </div>
                <div className="gd-trust-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Direct communication via Crewboard
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile bottom bar */}
        {(canHire || !viewerId) && (
          <div className="gd-mobile-bar">
            <div className="gd-mobile-bar-price">
              <span className="gd-mobile-bar-label">Starting at</span>
              {/* FIX 2 — formatted price */}
              <span className="gd-mobile-bar-amount">{formatPrice(gig.price)}</span>
            </div>
            {canHire ? (
              <ActionButton
                action={hireFromGig.bind(null, gig.id, gig.userId)}
                className="gd-hire-btn gd-hire-btn--primary gd-mobile-bar-btn"
              >
                Hire Now
              </ActionButton>
            ) : (
              <Link href={`/login?callbackUrl=/gigs/${id}`} className="gd-hire-btn gd-hire-btn--primary gd-mobile-bar-btn" style={{ textAlign: "center" }}>
                Sign in to hire
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
