import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { startConversation, hireFromProfile } from "@/actions/messages";
import EditProfileForm from "@/components/forms/EditProfileForm";
import LinkWallet from "@/components/forms/LinkWallet";
import LogoutButton from "@/components/ui/LogoutButton";
import OGBadge from "@/components/ui/OGBadge";
import { WalletVerifiedBadge, HumanVerifiedBadge } from "@/components/ui/VerificationBadges";
import StripeVerify from "@/components/ui/StripeVerify";
import SaveTalentButton from "@/components/ui/SaveTalentButton";

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "#22c55e",
  open: "#f59e0b",
  busy: "#ef4444",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available for work",
  open: "Open to offers",
  busy: "Not available",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  let user: any = null;
  let session: any = null;

  try {
    [user, session] = await Promise.all([
      db.user.findUnique({
        where: { twitterHandle: handle },
        include: {
          gigs: { where: { status: "active" }, orderBy: { createdAt: "desc" } },
        },
      }),
      auth(),
    ]);
  } catch (error) {
    console.error("Profile Page Error:", error);
  }

  if (!user || !user.profileComplete) notFound();

  // Fetch reviews received by this user
  const reviews = await db.review.findMany({
    where: { revieweeId: user.id },
    include: { reviewer: { select: { name: true, twitterHandle: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  const viewerId = (session?.user as any)?.userId as string | undefined;
  if (viewerId && viewerId !== user.id) {
    const recentView = await db.notification.findFirst({
      where: { userId: user.id, type: "profile_view", createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      select: { id: true },
    });
    if (!recentView) {
      const viewerName = session?.user?.name ?? (session?.user as any)?.twitterHandle ?? "Someone";
      await db.notification.create({
        data: { userId: user.id, type: "profile_view", title: "Someone viewed your profile", body: `${viewerName} visited your profile.` },
      });
    }
  }

  const avail = user.availability ?? "available";
  const availColor = AVAILABILITY_COLORS[avail];
  const isOwnProfile = viewerId === user.id;
  const canMessage = !!viewerId && !isOwnProfile;

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

  return (
    <main className="profile-page" style={{ minHeight: "100vh", paddingTop: "8.5rem", paddingBottom: "5rem", background: "#f8fafc" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 1.25rem" }}>

        {/* ── Hero Card ── */}
        <div className="profile-card" style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>

          {/* Avatar row */}
          <div style={{ padding: "1.75rem 2rem 1.75rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>

              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                border: "2px solid rgba(0,0,0,0.08)", flexShrink: 0,
                background: "#e2e8f0", overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              }}>
                {user.image
                  ? <img src={user.image} alt={user.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#134e4a,#0f172a)" }} />}
              </div>

              {/* Availability badge */}
              <div className="profile-avail-badge" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 99,
                fontSize: "0.72rem", fontWeight: 500,
                marginBottom: 4,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: availColor, flexShrink: 0, boxShadow: `0 0 5px ${availColor}` }} />
                {AVAILABILITY_LABELS[avail]}
              </div>
            </div>

            {/* Name + badges */}
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 className="profile-name" style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                {user.name ?? user.twitterHandle}
              </h1>
              {user.isOG && <OGBadge size="lg" />}
              {user.walletAddress && <WalletVerifiedBadge />}
              {user.humanVerified && <HumanVerifiedBadge level={user.worldIdLevel} />}
            </div>

            {/* Role + chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "0.85rem" }}>
              {user.role && (
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, padding: "4px 14px", borderRadius: 99,
                  background: "rgba(45,212,191,0.08)", color: "#0d9488",
                  border: "1px solid rgba(45,212,191,0.22)", letterSpacing: "0.02em",
                }}>
                  {user.role}
                </span>
              )}
              <span className="profile-chip" style={{ fontSize: "0.7rem", fontWeight: 500, padding: "4px 14px", borderRadius: 99 }}>
                Remote
              </span>
              {wallet && (
                <span className="profile-chip" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.63rem", fontWeight: 500, padding: "4px 14px", borderRadius: 99, display: "flex", alignItems: "center", gap: 5 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>
                  {wallet}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="profile-bio" style={{ marginTop: "1rem", fontSize: "0.86rem", lineHeight: 1.75, maxWidth: 560 }}>
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* ── Body grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: "1.1rem", marginTop: "1.1rem" }} className="profile-grid">

          {/* ── Left column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {/* Skills */}
            {user.skills.length > 0 && (
              <div className="profile-card" style={{ borderRadius: 16, padding: "1.4rem 1.5rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}>
                <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1rem" }}>
                  Skills
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {user.skills.map((s: string) => (
                    <span key={s} className="profile-skill-chip" style={{
                      fontSize: "0.73rem", fontWeight: 500, padding: "6px 14px", borderRadius: 8,
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {user.gigs.length > 0 && (
              <div className="profile-card" style={{ borderRadius: 16, padding: "1.4rem 1.5rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}>
                <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1rem" }}>
                  Services Offered
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {user.gigs.map((gig: any) => (
                    <Link key={gig.id} href={`/gigs/${gig.id}`} className="profile-gig-row" style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.9rem 1.1rem", borderRadius: 12, textDecoration: "none",
                      transition: "border-color 0.15s, background 0.15s",
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="profile-gig-title" style={{ fontWeight: 600, fontSize: "0.82rem" }}>{gig.title}</div>
                        <div style={{ fontSize: "0.66rem", color: "#94a3b8", marginTop: 3 }}>{gig.category} · {gig.deliveryDays}d delivery</div>
                      </div>
                      <span style={{ fontFamily: "Space Mono,monospace", fontWeight: 700, fontSize: "0.9rem", color: "#2DD4BF", flexShrink: 0, marginLeft: 12 }}>
                        ${gig.price}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            <div className="profile-card" style={{ borderRadius: 16, padding: "1.4rem 1.5rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}>
              <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Projects
              </div>
              <div className="profile-coming-soon-box" style={{ padding: "1rem 1.1rem", borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "#cbd5e1" }}>Coming soon</div>
                <div style={{ fontSize: "0.65rem", color: "#e2e8f0", marginTop: 3 }}>Portfolio projects will appear here</div>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {/* Contact */}
            {canMessage && (
              <div className="profile-card" style={{ borderRadius: 16, padding: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <form action={startConversation.bind(null, user.id)}>
                  <button type="submit" className="profile-msg-btn" style={{
                    width: "100%", padding: "0.75rem", borderRadius: 99,
                    fontWeight: 700, fontSize: "0.8rem", border: "none", cursor: "pointer", letterSpacing: "0.03em",
                    transition: "opacity 0.15s",
                  }}>
                    Message
                  </button>
                </form>
                <form action={hireFromProfile.bind(null, user.id)}>
                  <button type="submit" style={{
                    width: "100%", padding: "0.75rem", borderRadius: 99,
                    background: "rgba(45,212,191,0.07)", color: "#0d9488", fontWeight: 700,
                    fontSize: "0.8rem", border: "1px solid rgba(45,212,191,0.25)", cursor: "pointer", letterSpacing: "0.03em",
                    transition: "opacity 0.15s",
                  }}>
                    Hire
                  </button>
                </form>
                <SaveTalentButton targetUserId={user.id} initialSaved={isSaved} />
              </div>
            )}

            {/* Reputation */}
            <div className="profile-card" style={{ borderRadius: 16, padding: "1.25rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}>
              <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.9rem" }}>
                Reputation
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: reviews.length > 0 ? "1rem" : 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fefce8", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z"/>
                  </svg>
                </div>
                <div>
                  <div className="profile-rep-score" style={{ fontFamily: "Space Mono,monospace", fontWeight: 700, fontSize: "1.1rem" }}>
                    {avgRating ?? "—"}
                  </div>
                  <div style={{ fontSize: "0.63rem", color: "#94a3b8", marginTop: 1 }}>
                    {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : "No reviews yet"}
                  </div>
                </div>
              </div>
              {reviews.slice(0, 3).map((r: any) => (
                <div key={r.id} style={{ padding: "0.7rem 0.85rem", borderRadius: 10, background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: r.body ? "0.3rem" : 0 }}>
                    <span style={{ color: "#f59e0b", fontSize: "0.8rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ fontSize: "0.62rem", color: "#94a3b8" }}>{r.reviewer.name ?? r.reviewer.twitterHandle}</span>
                  </div>
                  {r.body && <p style={{ fontSize: "0.68rem", color: "#475569", margin: 0, lineHeight: 1.5 }}>{r.body}</p>}
                </div>
              ))}
            </div>

            {/* Wallet (visitors only) */}
            {wallet && !isOwnProfile && (
              <div className="profile-card" style={{ borderRadius: 16, padding: "1.1rem 1.25rem", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 8px rgba(0,0,0,0.03)" }}>
                <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  Wallet
                </div>
                <div className="profile-wallet-addr" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.68rem" }}>
                  {wallet}
                </div>
                <div style={{ fontSize: "0.61rem", color: "#94a3b8", marginTop: 4 }}>Verified on-chain</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Edit section (own profile only) ── */}
        {isOwnProfile && (
          <div id="edit-profile" style={{ marginTop: "1.1rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

            {/* Verification */}
            <div className="profile-card" style={{ borderRadius: 16, padding: "1.4rem 1.5rem", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.9rem" }}>
                Verification
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Wallet */}
                <div>
                  <div className="profile-label-text" style={{ fontSize: "0.72rem", fontWeight: 600, marginBottom: 4 }}>Wallet</div>
                  {user.walletAddress
                    ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <WalletVerifiedBadge />
                        <span style={{ fontFamily: "Space Mono,monospace", fontSize: "0.62rem", color: "#64748b" }}>
                          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                        </span>
                      </div>
                    : <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>No wallet linked — connect one below</div>
                  }
                </div>
                {/* Identity Verification */}
                <div>
                  <div className="profile-label-text" style={{ fontSize: "0.72rem", fontWeight: 600, marginBottom: 6 }}>Identity Verification</div>
                  <StripeVerify humanVerified={user.humanVerified} />
                </div>
              </div>
            </div>

            <div className="profile-card" style={{ borderRadius: 16, padding: "1.4rem 1.5rem", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem" }}>Wallet Link</div>
              <LinkWallet currentWallet={user.walletAddress} />
            </div>

            <div className="profile-card" style={{ borderRadius: 16, padding: "1.5rem", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="profile-section-label" style={{ fontFamily: "Space Mono,monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
                Edit Profile
              </div>
              <EditProfileForm
                initialRole={user.role ?? ""}
                initialSkills={user.skills}
                initialBio={user.bio ?? ""}
                initialAvailability={user.availability ?? "available"}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <LogoutButton />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
