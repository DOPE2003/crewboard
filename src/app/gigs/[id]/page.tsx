import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { startConversation } from "@/app/actions/messages";
import GigOwnerActions from "./GigOwnerActions";

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
        user: { select: { id: true, name: true, twitterHandle: true, image: true, role: true, bio: true, skills: true } },
      },
    }),
    auth(),
  ]);

  if (!gig || gig.status !== "active") notFound();

  const viewerId = (session?.user as any)?.userId as string | undefined;
  const isOwner = viewerId === gig.userId;
  const canHire = !!viewerId && !isOwner;

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card profile-card" style={{ maxWidth: 760, width: "100%" }}>

          {/* Back */}
          <Link href="/gigs" className="gig-back-link">
            ← All Gigs
          </Link>

          {/* Category + price header */}
          <div className="gig-detail-header">
            <span className="gig-category-badge">{gig.category}</span>
            <div className="gig-detail-price">
              <span className="gig-detail-price-label">Starting at</span>
              <span className="gig-detail-price-value">${gig.price}</span>
            </div>
          </div>

          <h1 className="gig-detail-title">{gig.title}</h1>

          {/* Meta row */}
          <div className="gig-detail-meta">
            <div className="gig-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {gig.deliveryDays} day{gig.deliveryDays !== 1 ? "s" : ""} delivery
            </div>
          </div>

          {/* Description */}
          <div className="dash-section-label" style={{ marginTop: "1.5rem" }}>About this gig</div>
          <p className="gig-detail-description">{gig.description}</p>

          {/* Tags */}
          {gig.tags.length > 0 && (
            <div className="dash-skills" style={{ marginTop: "1rem" }}>
              {gig.tags.map((t) => (
                <span key={t} className="dash-skill-chip">{t}</span>
              ))}
            </div>
          )}

          <div className="dash-divider" />

          {/* Seller info */}
          <div className="dash-section-label">About the seller</div>
          <div className="gig-seller-card">
            <Link href={`/u/${gig.user.twitterHandle}`} className="gig-seller-info">
              {gig.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gig.user.image} alt="" className="gig-seller-avatar" />
              ) : (
                <div className="gig-seller-avatar-fallback" />
              )}
              <div>
                <div className="gig-seller-name">{gig.user.name ?? gig.user.twitterHandle}</div>
                <div className="gig-seller-handle">@{gig.user.twitterHandle}</div>
                {gig.user.role && <div className="talent-role" style={{ marginTop: 4 }}>{gig.user.role}</div>}
              </div>
            </Link>
            {gig.user.bio && <p className="gig-seller-bio">{gig.user.bio}</p>}
            {gig.user.skills.length > 0 && (
              <div className="dash-skills" style={{ marginTop: 8 }}>
                {gig.user.skills.slice(0, 6).map((s) => (
                  <span key={s} className="dash-skill-chip">{s}</span>
                ))}
              </div>
            )}
          </div>

          <div className="dash-divider" />

          {/* CTA */}
          {canHire && (
            <form action={startConversation.bind(null, gig.userId)}>
              <button type="submit" className="btn-primary" style={{ width: "100%", cursor: "pointer" }}>
                Contact Seller
              </button>
            </form>
          )}

          {isOwner && (
            <GigOwnerActions gigId={gig.id} currentStatus={gig.status} />
          )}

          {!viewerId && (
            <Link href="/login" className="btn-primary" style={{ width: "100%", textAlign: "center" }}>
              Sign in to contact seller
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
