import db from "@/lib/db";
import { auth } from "@/auth";
import { notifyUser } from "@/lib/notify";
import { redirect } from "next/navigation";
import Link from "next/link";
import BannerUpload from "@/components/ui/BannerUpload";
import ContactButtons from "@/components/ui/ContactButtons";
import LogoutButton from "@/components/ui/LogoutButton";
import OGBadge from "@/components/ui/OGBadge";
import { WalletVerifiedBadge } from "@/components/ui/VerificationBadges";
import SaveTalentButton from "@/components/ui/SaveTalentButton";
import AvatarUpload from "@/components/ui/AvatarUpload";
import EditProfilePanel from "@/components/ui/EditProfilePanel";
import PortfolioEditor from "@/components/forms/PortfolioEditor";
import SocialLinksEditor from "@/components/ui/SocialLinksEditor";
import type { PortfolioItem } from "@/actions/portfolio";
import CvUpload from "@/components/ui/CvUpload";
import { blobUrl } from "@/lib/blobUrl";
import AddEmailForm from "@/components/forms/AddEmailForm";
import DeleteAccountButton from "@/components/ui/DeleteAccountButton";

const AVAIL_COLOR: Record<string, string> = {
  available: "#22c55e", open: "#f59e0b", busy: "#ef4444",
};
const AVAIL_LABEL: Record<string, string> = {
  available: "Available now", open: "Open to offers", busy: "Currently busy",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
      {children}
    </div>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--card-border)",
      padding: "1.25rem", ...style,
    }}>
      {children}
    </div>
  );
}

export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const normalizedHandle = handle.replace(/^@/, "").toLowerCase();

  let user: any = null;
  let session: any = null;

  try {
    [user, session] = await Promise.all([
      db.user.findFirst({
        where: { twitterHandle: normalizedHandle },
        include: { gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" } } },
      }),
      auth(),
    ]);
  } catch (e) { console.error(e); }

  if (!user) {
    return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Profile not found.</div>;
  }
  if (!user.profileComplete) {
    const viewerIdEarly = (session?.user as any)?.userId as string | undefined;
    const viewerHandleEarly = (session?.user as any)?.twitterHandle as string | undefined;
    const isOwner =
      (viewerIdEarly && viewerIdEarly === user.id) ||
      (viewerHandleEarly && viewerHandleEarly.toLowerCase() === normalizedHandle);
    if (isOwner) redirect("/dashboard");
    return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Profile not found.</div>;
  }

  const [reviews, completedOrdersCount, totalEarnedAgg] = await Promise.all([
    db.review.findMany({
      where: { revieweeId: user.id },
      include: { reviewer: { select: { name: true, twitterHandle: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.order.count({ where: { sellerId: user.id, status: "completed" } }),
    db.order.aggregate({ where: { sellerId: user.id, status: "completed" }, _sum: { amount: true } }),
  ]);

  const totalEarned = totalEarnedAgg._sum.amount ?? 0;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const viewerId = (session?.user as any)?.userId as string | undefined;

  // Profile view tracking
  if (viewerId && viewerId !== user.id) {
    const viewerName = session?.user?.name ?? (session?.user as any)?.twitterHandle ?? "Someone";
    const recentView = await db.notification.findFirst({
      where: {
        userId: user.id, type: "profile_view",
        body: { contains: viewerName },
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
      select: { id: true },
    });
    if (!recentView) {
      notifyUser({
        userId: user.id,
        type: "profile_view",
        title: "Someone viewed your profile",
        body: `${viewerName} visited your profile.`,
        link: `/u/${user.twitterHandle ?? handle}`,
      }).catch(() => {});
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

  const joinDate = new Date(user.createdAt);
  const joinMonthYear = joinDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  // Profile completion
  const completionItems = [
    { label: "Profile photo", done: !!user.image },
    { label: "Role", done: !!user.userTitle },
    { label: "Bio", done: !!user.bio && user.bio.length > 3 },
    { label: "Skills", done: (user.skills?.length ?? 0) > 0 },
    { label: "Availability", done: !!user.availability },
    { label: "Portfolio item", done: (user.portfolioItems?.length ?? 0) > 0 },
    { label: "CV / Resume", done: !!user.cvUrl },
    { label: "Service posted", done: user.gigs?.length > 0 },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);
  const nextItem = completionItems.find(i => !i.done);

  const displayName = user.name ?? (user.twitterId ? "Anonymous" : user.twitterHandle);
  const firstName = displayName.split(" ")[0];

  // Lowest active gig price
  const minGigPrice = user.gigs?.length > 0
    ? Math.min(...(user.gigs as any[]).map((g: any) => g.price ?? Infinity))
    : null;

  // Last active label
  let lastActiveLabel = "";
  if (user.lastSeenAt) {
    const diffMin = Math.floor((Date.now() - new Date(user.lastSeenAt).getTime()) / 60000);
    const diffHr  = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffMin < 5)       lastActiveLabel = "Active now";
    else if (diffMin < 60) lastActiveLabel = `Active ${diffMin}m ago`;
    else if (diffHr < 24)  lastActiveLabel = `Active ${diffHr}h ago`;
    else if (diffDay < 7)  lastActiveLabel = `Active ${diffDay}d ago`;
  }

  // "Why hire me" bullets derived from existing data
  const whyChooseBullets: string[] = [
    completedOrdersCount > 0
      ? `${completedOrdersCount} completed order${completedOrdersCount > 1 ? "s" : ""} on Crewboard`
      : null,
    avgRating
      ? `${avgRating}-star rating across ${reviews.length} client review${reviews.length > 1 ? "s" : ""}`
      : null,
    user.walletAddress
      ? "Wallet verified — payments settled on-chain, no chargebacks"
      : null,
    (user.skills?.length ?? 0) > 0
      ? `Skilled in ${(user.skills as string[]).slice(0, 3).join(", ")}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", paddingTop: "5rem", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "0 1.25rem" }}>

        {/* Email section — always shown to profile owner */}
        {isOwnProfile && (
          <div style={{ marginBottom: "1rem" }}>
            <AddEmailForm currentEmail={user.email ?? null} />
          </div>
        )}

        {/* ── Cover Banner + Profile Header ── */}
        <div style={{ borderRadius: 16, border: "1px solid var(--card-border)", overflow: "visible", marginBottom: "1rem" }}>

          {/* Cover banner */}
          {isOwnProfile ? (
            /* Own profile: interactive banner with upload */
            <div style={{ position: "relative" }}>
              <BannerUpload currentBanner={user.bannerImage ?? null} />
              {/* Edit profile button overlay */}
              <div style={{ position: "absolute", top: "1rem", right: "1.5rem", zIndex: 3 }}>
                <EditProfilePanel
                  initialRole={user.userTitle ?? ""}
                  initialSkills={user.skills}
                  initialBio={user.bio ?? ""}
                  initialAvailability={user.availability ?? "available"}
                />
              </div>
            </div>
          ) : (
            /* Visitor view: static banner — fixed 3:1 ratio */
            <div
              className="profile-cover-banner"
              style={{
                width: "100%", aspectRatio: "3 / 1", position: "relative",
                background: user.bannerImage ? undefined : "#E8FAF7",
                backgroundImage: user.bannerImage ? `url(${user.bannerImage})` : undefined,
                backgroundSize: "cover", backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                borderRadius: "16px 16px 0 0", overflow: "hidden", borderBottom: "none",
              }}
            />
          )}

          {/* Profile content below banner */}
          <div style={{ background: "var(--background)", padding: "0 0 1.25rem", borderRadius: "0 0 16px 16px", overflow: "visible" }}>
            {/* Avatar + save button row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", paddingLeft: 24, paddingRight: 24 }}>
              {/* Avatar — floats up to overlap banner */}
              <div style={{ position: "relative", marginTop: -44, zIndex: 10, flexShrink: 0 }}>
                {isOwnProfile ? (
                  <AvatarUpload currentImage={user.image} name={user.name} isTwitterUser={!!user.twitterId} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: "9999px", border: "3px solid var(--background)", background: "linear-gradient(135deg,#134e4a,#0f172a)", overflow: "hidden" }}>
                    {user.image && <img src={user.image} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                )}
              </div>
              {canMessage && (
                <div style={{ paddingTop: "0.5rem" }}>
                  <SaveTalentButton targetUserId={user.id} initialSaved={isSaved} />
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div style={{ marginTop: "0.65rem", padding: "0 24px" }}>
              {/* Row 1: Name + OG + Wallet + CTA buttons (visitor) */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
                      {displayName}
                    </h1>
                    {user.isOG && <OGBadge size="lg" />}
                    {user.walletAddress && <WalletVerifiedBadge />}
                    {avgRating && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "13px", fontWeight: 700, color: "#92400e", background: "#fef3c7", border: "1px solid #fde68a", padding: "2px 9px", borderRadius: 99, flexShrink: 0 }}>
                        ★ {avgRating}
                        <span style={{ fontWeight: 400, fontSize: "11px", color: "#a16207" }}>({reviews.length})</span>
                      </span>
                    )}
                  </div>
                  {/* Role title + starting price */}
                  <div style={{ marginTop: 5, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    {user.userTitle && (
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)" }}>
                        {user.userTitle}
                      </span>
                    )}
                    {minGigPrice !== null && (
                      <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                        · Starting from <span style={{ fontWeight: 700, color: "#14B8A6" }}>${minGigPrice}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary CTAs — visitors only, top right */}
                {canMessage && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <ContactButtons recipientId={user.id} />
                  </div>
                )}
              </div>

              {/* Row 2: Availability + last active + handle + member since */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                  background: avail === "available" ? "#dcfce7" : avail === "busy" ? "#fee2e2" : "var(--card-bg)",
                  color: avail === "available" ? "#166534" : avail === "busy" ? "#991b1b" : "var(--text-muted)",
                  border: "1px solid " + (avail === "available" ? "rgba(34,197,94,0.25)" : avail === "busy" ? "rgba(239,68,68,0.2)" : "var(--card-border)"),
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: AVAIL_COLOR[avail], animation: avail === "available" ? "availPulse 2s ease-in-out infinite" : undefined }} />
                  {AVAIL_LABEL[avail]}
                </span>
                {lastActiveLabel && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: lastActiveLabel === "Active now" ? "#22c55e" : "#d1d5db", display: "inline-block" }} />
                    {lastActiveLabel}
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>@{user.twitterHandle}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Member since {joinMonthYear}</span>
              </div>

              {/* Social links */}
              <div style={{ marginTop: "0.5rem" }}>
                <SocialLinksEditor
                  twitterHandle={user.twitterHandle}
                  telegramHandle={user.telegramHandle ?? null}
                  website={user.website ?? null}
                  githubHandle={user.githubHandle ?? null}
                  isOwnProfile={isOwnProfile}
                />
              </div>

              {/* Bio */}
              {user.bio ? (
                <p style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text-muted)", margin: "0.75rem 0 0", maxWidth: "60ch" }}>
                  {user.bio}
                </p>
              ) : isOwnProfile ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", margin: "0.75rem 0 0" }}>
                  Add a bio to tell clients about yourself.
                </p>
              ) : null}

              {/* Escrow trust banner — visitor view */}
              {!isOwnProfile && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "1rem", padding: "8px 12px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f766e" }}>
                    Payments secured via Solana escrow — funds are only released when you approve the work
                  </span>
                  {user.walletAddress && (
                    <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: "10px", fontWeight: 700, color: "#16a34a", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 99 }}>
                      Wallet verified
                    </span>
                  )}
                </div>
              )}

              {/* "Why hire" bullets — visitor view */}
              {!isOwnProfile && whyChooseBullets.length > 0 && (
                <div style={{ marginTop: "0.85rem", padding: "0.85rem 1rem", background: "var(--card-bg)", borderRadius: 10, border: "1px solid var(--card-border)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#14b8a6", marginBottom: "0.6rem" }}>
                    Why hire {firstName}?
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {whyChooseBullets.map(b => (
                      <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: "13px", color: "var(--foreground)", lineHeight: 1.5 }}>
                        <span style={{ color: "#14b8a6", fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Profile completion bar (own profile only) */}
              {isOwnProfile && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--card-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Profile {completionPct}% complete
                    </span>
                    {nextItem && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Next: <strong style={{ color: "var(--foreground)" }}>{nextItem.label}</strong>
                      </span>
                    )}
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct === 100 ? "#22c55e" : "#14B8A6", borderRadius: 99, transition: "width 0.4s" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="profile-page-grid" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem", alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Services — moved to top of left column for conversion */}
            {(isOwnProfile || (user.gigs?.length > 0)) && (
              <SectionCard>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <SectionLabel>Services</SectionLabel>
                  {isOwnProfile && (
                    <Link href="/gigs/new" style={{ fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: "rgba(20,184,166,0.08)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.2)", textDecoration: "none" }}>
                      + Add service
                    </Link>
                  )}
                </div>
                {user.gigs?.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
                    {user.gigs.map((gig: any) => (
                      <Link key={gig.id} href={`/gigs/${gig.id}`} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0.9rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--background)", textDecoration: "none" }}>
                        {gig.category && (
                          <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#14B8A6" }}>{gig.category}</span>
                        )}
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", lineHeight: 1.45 }}>
                          {gig.title}
                        </div>
                        {gig.description && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                            {gig.description}
                          </div>
                        )}
                        <div style={{ marginTop: "auto", paddingTop: 6, borderTop: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#14B8A6", fontSize: "15px" }}>${gig.price}</span>
                            {(gig.deliveryDays ?? gig.deliverInDays) && (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {gig.deliveryDays ?? gig.deliverInDays}d delivery
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "11px", color: "#14B8A6", fontWeight: 700 }}>Hire →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : isOwnProfile ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(20,184,166,0.03)", borderRadius: 10, border: "1px dashed rgba(20,184,166,0.25)" }}>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 0.75rem" }}>Post your first service to start getting hired.</p>
                    <Link href="/gigs/new" style={{ display: "inline-block", fontSize: "12px", fontWeight: 700, padding: "7px 18px", borderRadius: 8, background: "#14B8A6", color: "#fff", textDecoration: "none" }}>
                      Post a service
                    </Link>
                  </div>
                ) : null}
              </SectionCard>
            )}

            {/* Skills */}
            <SectionCard>
              <SectionLabel>Skills</SectionLabel>
              {user.skills?.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {user.skills.map((s: string) => (
                    <span key={s} style={{
                      fontSize: "13px", fontWeight: 600, padding: "6px 16px", borderRadius: 99,
                      background: "rgba(20,184,166,0.07)", color: "var(--foreground)",
                      border: "1px solid rgba(20,184,166,0.2)",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                  {isOwnProfile ? "No skills yet — edit your profile to add some." : "No skills listed."}
                </p>
              )}
            </SectionCard>

            {/* Portfolio */}
            {(isOwnProfile || portfolioItems.length > 0) && (
              <SectionCard>
                <SectionLabel>Portfolio</SectionLabel>
                {isOwnProfile ? (
                  <PortfolioEditor initialItems={portfolioItems} handle={user.twitterHandle} />
                ) : portfolioItems.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                    {portfolioItems.map((item: any) => {
                      const colors = ["#E8FAF7", "#EEF2FF", "#FFF7ED", "#F0FDF4", "#FDF4FF"];
                      const idx = (item.id ?? "0").charCodeAt(0) % colors.length;
                      // Handle both old schema (url field for project links) and new schema (mediaUrl for uploads)
                      const rawMediaUrl: string = item.mediaUrl ?? item.image ?? "";
                      const rawMediaType: string = item.mediaType ?? item.type ?? (
                        rawMediaUrl.match(/\.(mp4|webm|mov)$/i) ? "video" :
                        rawMediaUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? "image" :
                        rawMediaUrl.match(/\.pdf$/i) ? "pdf" :
                        rawMediaUrl.startsWith("data:video") ? "video" :
                        rawMediaUrl.startsWith("data:image") ? "image" :
                        rawMediaUrl ? "image" : ""
                      );
                      const proxiedUrl = rawMediaUrl ? blobUrl(rawMediaUrl) : undefined;
                      return (
                        <div key={item.id} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--card-border)", background: "var(--background)" }}>
                          {/* Media preview */}
                          {rawMediaType === "video" && proxiedUrl ? (
                            <div style={{ background: "#000", aspectRatio: "16/9" }}>
                              <video src={proxiedUrl} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}>
                                <source src={proxiedUrl} type="video/mp4" />
                              </video>
                            </div>
                          ) : rawMediaType === "image" && proxiedUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={proxiedUrl} alt={item.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block", background: "#f3f4f6" }} />
                          ) : rawMediaType === "pdf" && proxiedUrl ? (
                            <a href={proxiedUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fef2f2", padding: "24px", textDecoration: "none", gap: 6, aspectRatio: "16/9" }}>
                              <span style={{ fontSize: 36 }}>📄</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626" }}>PDF</span>
                            </a>
                          ) : proxiedUrl ? (
                            <a href={proxiedUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#eff6ff", padding: "24px", textDecoration: "none", gap: 6, aspectRatio: "16/9" }}>
                              <span style={{ fontSize: 36 }}>📋</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb" }}>File</span>
                            </a>
                          ) : (
                            <a href={item.url ?? "#"} target={item.url ? "_blank" : undefined} rel="noopener noreferrer" style={{ display: "flex", aspectRatio: "16/9", background: colors[idx], alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                              <span style={{ fontSize: "32px", opacity: 0.3 }}>◆</span>
                            </a>
                          )}
                          {/* Info */}
                          <div style={{ padding: "0.75rem 0.9rem", borderTop: "1px solid var(--card-border)" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
                              {item.title}
                            </div>
                            {item.description && (
                              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                                {item.description}
                              </div>
                            )}
                            {item.url && !item.mediaUrl && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#14B8A6", fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: 6 }}>
                                View project →
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>No portfolio items yet.</p>
                )}
              </SectionCard>
            )}

            {/* Reviews */}
            <SectionCard>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <SectionLabel>Reviews ({reviews.length})</SectionLabel>
                {avgRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Stars rating={Math.round(Number(avgRating))} />
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)" }}>{avgRating}</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div style={{ background: "var(--background)", borderRadius: 10, border: "1px solid var(--card-border)", padding: "1.5rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {isOwnProfile ? "Reviews from clients will appear here." : "No reviews yet."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {reviews.map((r: any) => (
                    <div key={r.id} style={{ borderBottom: "1px solid var(--card-border)", paddingBottom: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--avatar-bg)", overflow: "hidden", flexShrink: 0 }}>
                            {r.reviewer.image && <img src={r.reviewer.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--foreground)" }}>
                            {r.reviewer.name ?? r.reviewer.twitterHandle}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Stars rating={r.rating} />
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      {r.body && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{r.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Mobile-only wallet shortcut — desktop has this in the navbar dropdown */}
            {isOwnProfile && (
              <div className="md:hidden">
                <SectionCard>
                  <SectionLabel>Wallet</SectionLabel>
                  {wallet ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/>
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--foreground)", fontFamily: "monospace" }}>{wallet}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: 1 }}>Solana · Verified</div>
                        </div>
                      </div>
                      <Link href="/billing" style={{ fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: "rgba(20,184,166,0.08)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.2)", textDecoration: "none", flexShrink: 0 }}>
                        $Wallet →
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>No wallet connected.</p>
                      <Link href="/billing" style={{ fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: "rgba(20,184,166,0.08)", color: "#0d9488", border: "1px solid rgba(20,184,166,0.2)", textDecoration: "none", flexShrink: 0 }}>
                        Connect →
                      </Link>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="profile-sidebar-col" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Stats 2×2 */}
            <SectionCard>
              <SectionLabel>Stats</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--card-border)", borderRadius: 10, overflow: "hidden", border: "1px solid var(--card-border)" }}>
                {[
                  { label: "Orders", value: completedOrdersCount, teal: false },
                  { label: "Earned", value: totalEarned > 0 ? `$${totalEarned.toLocaleString()}` : "—", teal: totalEarned > 0 },
                  { label: "Reviews", value: reviews.length, teal: false },
                  { label: "Since", value: joinMonthYear, teal: false },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "var(--card-bg)", padding: "0.75rem" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: stat.teal ? "#14B8A6" : "var(--foreground)", lineHeight: 1.2 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Wallet */}
            <SectionCard>
              <SectionLabel>Wallet</SectionLabel>
              {wallet ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--foreground)", fontFamily: "monospace" }}>{wallet}</span>
                        <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: 99, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>
                          Verified
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 2 }}>Solana</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>No wallet connected.</p>
                </div>
              )}
            </SectionCard>

            {/* CV */}
            {isOwnProfile ? (
              <SectionCard>
                <SectionLabel>CV / Resume</SectionLabel>
                <CvUpload currentCvUrl={user.cvUrl ?? null} />
              </SectionCard>
            ) : user.cvUrl ? (
              <SectionCard>
                <SectionLabel>CV / Resume</SectionLabel>
                <a href={user.cvUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.65rem 0.9rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--background)", textDecoration: "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--foreground)" }}>Download CV</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>PDF</div>
                  </div>
                </a>
              </SectionCard>
            ) : null}

            {/* Sign out + Delete account (own profile) */}
            {isOwnProfile && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "0.25rem" }}
                className="profile-signout-wrap">
                <LogoutButton />
                <DeleteAccountButton />
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}
