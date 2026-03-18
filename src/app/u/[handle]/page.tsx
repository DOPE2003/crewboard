import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import ContactButtons from "@/components/ui/ContactButtons";
import LogoutButton from "@/components/ui/LogoutButton";
import OGBadge from "@/components/ui/OGBadge";
import { WalletVerifiedBadge } from "@/components/ui/VerificationBadges";
import SaveTalentButton from "@/components/ui/SaveTalentButton";
import AvatarUpload from "@/components/ui/AvatarUpload";
import EditProfilePanel from "@/components/ui/EditProfilePanel";
import PortfolioEditor from "@/components/forms/PortfolioEditor";
import type { PortfolioItem } from "@/actions/portfolio";
import CvUpload from "@/components/ui/CvUpload";
import AddEmailForm from "@/components/forms/AddEmailForm";

const AVAIL_COLOR: Record<string, string> = {
  available: "#22c55e", open: "#f59e0b", busy: "#ef4444",
};
const AVAIL_LABEL: Record<string, string> = {
  available: "Available", open: "Open to offers", busy: "Not available",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--card-border)",
      padding: "1.5rem", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", margin: "0 0 1rem" }}>
      {children}
    </h2>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  let user: any = null;
  let session: any = null;

  try {
    [user, session] = await Promise.all([
      db.user.findUnique({
        where: { twitterHandle: handle },
        include: { gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" } } },
      }),
      auth(),
    ]);
  } catch (e) { console.error(e); }

  if (!user || !user.profileComplete) notFound();

  const reviews = await db.review.findMany({
    where: { revieweeId: user.id },
    include: { reviewer: { select: { name: true, twitterHandle: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const viewerId = (session?.user as any)?.userId as string | undefined;

  // Profile view tracking — deduplicated per viewer per 24h
  if (viewerId && viewerId !== user.id) {
    const viewerName = session?.user?.name ?? (session?.user as any)?.twitterHandle ?? "Someone";
    const recentView = await db.notification.findFirst({
      where: {
        userId: user.id,
        type: "profile_view",
        body: { contains: viewerName },
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
      select: { id: true },
    });
    if (!recentView) {
      await db.notification.create({
        data: { userId: user.id, type: "profile_view", title: "Someone viewed your profile", body: `${viewerName} visited your profile.` },
      });
    }
  }

  const portfolioItems: PortfolioItem[] = Array.isArray(user.portfolioItems) ? user.portfolioItems as PortfolioItem[] : [];

  const isOwnProfile = viewerId === user.id;
  const canMessage = !!viewerId && !isOwnProfile;
  const avail = user.availability ?? "available";

  let isSaved = false;
  if (viewerId && !isOwnProfile) {
    const saved = await db.savedTalent.findUnique({
      where: { saverId_savedUserId: { saverId: viewerId, savedUserId: user.id } },
      select: { id: true },
    });
    isSaved = !!saved;
  }

  const wallet = user.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : null;

  // Profile completion score (own profile only)
  const completionItems = [
    { label: "Profile photo", done: !!user.image },
    { label: "Role", done: !!user.role },
    { label: "Bio", done: !!user.bio && user.bio.length > 3 },
    { label: "Skills", done: (user.skills?.length ?? 0) > 0 },
    { label: "Availability", done: !!user.availability },
    { label: "Portfolio item", done: (user.portfolioItems?.length ?? 0) > 0 },
    { label: "CV / Resume", done: !!user.cvUrl },
    { label: "Gig posted", done: user.gigs?.length > 0 },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);
  const nextItem = completionItems.find(i => !i.done);

  const joinYear = new Date(user.createdAt).getFullYear();

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", paddingTop: "9.5rem", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 1.25rem" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/freelancers" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Freelancers</Link>
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>{user.twitterId ? (user.name ?? "Profile") : `@${user.twitterHandle}`}</span>
        </div>

        {/* Email notification banner — own profile, no email (X-only users) */}
        {isOwnProfile && !user.email && (
          <div style={{ marginBottom: "1.25rem" }}>
            <AddEmailForm />
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }} className="profile-page-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Profile Header Card */}
            <SectionCard>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
                  {/* Avatar — clickable to change if own profile */}
                  {isOwnProfile ? (
                    <AvatarUpload currentImage={user.image} name={user.name} isTwitterUser={!!user.twitterId} />
                  ) : (
                    <div style={{
                      width: 90, height: 90, borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg,#134e4a,#0f172a)", overflow: "hidden",
                      border: "3px solid #f1f5f9",
                    }}>
                      {user.image && <img src={user.image} alt={user.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "var(--foreground)" }}>
                        {user.name ?? (user.twitterId ? "Anonymous" : user.twitterHandle)}
                      </h1>
                      {user.isOG && <OGBadge size="lg" />}
                      {user.walletAddress && <WalletVerifiedBadge />}
                    </div>

                    {!user.twitterId && (
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 3 }}>
                        @{user.twitterHandle}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "0.6rem", flexWrap: "wrap" }}>
                      {user.role && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#0d9488", background: "rgba(45,212,191,0.08)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(45,212,191,0.2)" }}>
                          {user.role}
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: AVAIL_COLOR[avail], display: "inline-block" }} />
                        {AVAIL_LABEL[avail]}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        Member since {joinYear}
                      </span>
                      {avgRating && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          <span style={{ color: "#f59e0b" }}>★</span>
                          {avgRating} ({reviews.length})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons in header */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                  {isOwnProfile && (
                    <EditProfilePanel
                      initialRole={user.role ?? ""}
                      initialSkills={user.skills}
                      initialBio={user.bio ?? ""}
                      initialAvailability={user.availability ?? "available"}
                    />
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Overview / Bio */}
            <SectionCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
                <SectionTitle>Overview</SectionTitle>
              </div>
              {user.bio ? (
                <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "var(--text-muted)", margin: 0 }}>{user.bio}</p>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic" }}>
                  {isOwnProfile ? "Add a bio to tell clients about yourself." : "No overview yet."}
                </div>
              )}
            </SectionCard>

            {/* Skills */}
            {user.skills?.length > 0 && (
              <SectionCard>
                <SectionTitle>Skills</SectionTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.skills.map((s: string) => (
                    <span key={s} style={{
                      fontSize: "0.78rem", fontWeight: 500, padding: "5px 14px", borderRadius: 99,
                      background: "rgba(var(--foreground-rgb), 0.05)", color: "var(--foreground)", border: "1px solid var(--card-border)",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Portfolio */}
            {(isOwnProfile || portfolioItems.length > 0) && (
              <SectionCard>
                <SectionTitle>Projects</SectionTitle>
                {isOwnProfile ? (
                  <PortfolioEditor initialItems={portfolioItems} handle={user.twitterHandle} />
                ) : portfolioItems.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {portfolioItems.map((item) => (
                      <div key={item.id} style={{ padding: "0.85rem 1rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--background)" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--foreground)" }}>{item.title}</span>
                          {item.year && <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{item.year}</span>}
                        </div>
                        {item.description && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.35rem 0 0", lineHeight: 1.6 }}>{item.description}</p>}
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#2DD4BF", textDecoration: "none", display: "inline-block", marginTop: 6 }}>
                            View project →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </SectionCard>
            )}

            {/* Services */}
            {user.gigs?.length > 0 && (
              <SectionCard>
                <SectionTitle>Services</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {user.gigs.map((gig: any) => (
                    <Link key={gig.id} href={`/gigs/${gig.id}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.9rem 1rem", borderRadius: 10, textDecoration: "none",
                      border: "1px solid var(--card-border)", transition: "border-color 0.15s",
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)" }}>{gig.title}</div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 3 }}>{gig.category} · {gig.deliveryDays}d delivery</div>
                      </div>
                      <span style={{ fontFamily: "Space Mono,monospace", fontWeight: 700, fontSize: "0.9rem", color: "#2DD4BF", flexShrink: 0, marginLeft: 12 }}>
                        from ${gig.price}
                      </span>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Reviews */}
            <SectionCard>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <SectionTitle>
                  Reviews {reviews.length > 0 && (
                    <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", marginLeft: 6 }}>
                      ({reviews.length})
                    </span>
                  )}
                </SectionTitle>
                {avgRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Stars rating={Math.round(Number(avgRating))} />
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)" }}>{avgRating}</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⭐</div>
                  <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                    {isOwnProfile ? "Reviews from clients will appear here." : "No reviews yet."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {reviews.map((r: any) => (
                    <div key={r.id} style={{ borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e2e8f0", overflow: "hidden", flexShrink: 0 }}>
                            {r.reviewer.image && <img src={r.reviewer.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>
                            {r.reviewer.name ?? r.reviewer.twitterHandle}
                          </span>
                        </div>
                        <Stars rating={r.rating} />
                      </div>
                      {r.body && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{r.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

          </div>

          {/* ── RIGHT COLUMN (Sidebar) ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Own profile: completion + quick links */}
            {isOwnProfile && (
              <>
                <SectionCard>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>Profile completion</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: completionPct === 100 ? "#22c55e" : "#f59e0b" }}>{completionPct}%</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(var(--foreground-rgb), 0.05)", borderRadius: 99, overflow: "hidden", marginBottom: "0.9rem" }}>
                    <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "#22c55e" : "#2DD4BF", borderRadius: 99, transition: "width 0.4s" }} />
                  </div>
                  {nextItem && (
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "var(--background)", padding: "0.65rem 0.85rem", borderRadius: 8, border: "1px solid var(--card-border)" }}>
                      Next: <strong style={{ color: "var(--foreground)" }}>Add {nextItem.label}</strong>
                    </div>
                  )}
                  {completionPct === 100 && (
                    <div style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 600 }}>Profile complete!</div>
                  )}
                </SectionCard>

                <SectionCard style={{ padding: "1rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.75rem" }}>Quick links</div>
                  {[
                    { label: "My Orders", href: "/orders", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> },
                    { label: "My Gigs", href: "/gigs/mine", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg> },
                    { label: "Messages", href: "/messages", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                    { label: "Favorites", href: "/saved-talents", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
                  ].map(link => (
                    <Link key={link.href} href={link.href} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "0.6rem 0.5rem", borderRadius: 8, textDecoration: "none",
                      color: "var(--foreground)", fontSize: "0.85rem", fontWeight: 500,
                      transition: "background 0.12s",
                    }}>
                      <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </SectionCard>

                <Link href="/gigs/new" style={{
                  display: "block", textAlign: "center", padding: "0.75rem",
                  background: "#0f172a", color: "#fff", borderRadius: 10,
                  fontWeight: 700, fontSize: "0.82rem", textDecoration: "none",
                  letterSpacing: "0.04em",
                }}>
                  + Post a Gig
                </Link>
              </>
            )}

            {/* Visitor: contact card */}
            {canMessage && (
              <SectionCard style={{ padding: "1.25rem" }}>
                <ContactButtons recipientId={user.id} />
                <div style={{ marginTop: "0.6rem" }}>
                  <SaveTalentButton targetUserId={user.id} initialSaved={isSaved} />
                </div>
              </SectionCard>
            )}

            {/* Stats */}
            <SectionCard style={{ padding: "1.25rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.9rem" }}>Stats</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Rating</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 4 }}>
                    {avgRating ? <><span style={{ color: "#f59e0b" }}>★</span>{avgRating}</> : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Reviews</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--foreground)" }}>{reviews.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Services</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--foreground)" }}>{user.gigs?.length ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Member since</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--foreground)" }}>{joinYear}</span>
                </div>
              </div>
            </SectionCard>

            {/* CV */}
            {isOwnProfile ? (
              <SectionCard style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.75rem" }}>CV / Resume</div>
                <CvUpload currentCvUrl={user.cvUrl ?? null} />
              </SectionCard>
            ) : user.cvUrl ? (
              <SectionCard style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.75rem" }}>CV / Resume</div>
                <a
                  href={user.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.65rem 0.9rem", borderRadius: 10,
                    border: "1px solid var(--card-border)", background: "var(--background)", textDecoration: "none",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)" }}>Download CV</div>
                    <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>PDF</div>
                  </div>
                  <svg style={{ marginLeft: "auto" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </a>
              </SectionCard>
            ) : null}

            {/* Wallet */}
            {wallet && (
              <SectionCard style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.75rem" }}>Wallet</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <WalletVerifiedBadge />
                  <span style={{ fontFamily: "Space Mono,monospace", fontSize: "0.72rem", color: "var(--foreground)" }}>{wallet}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Solana</div>
              </SectionCard>
            )}

          </div>
        </div>

        {/* Logout */}
        {isOwnProfile && (
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem", maxWidth: 720 }}>
            <LogoutButton />
          </div>
        )}

      </div>
    </main>
  );
}
