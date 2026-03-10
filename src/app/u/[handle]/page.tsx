import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { startConversation } from "@/actions/messages";

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "rgba(120,255,180,0.8)",
  open: "rgba(255,200,80,0.8)",
  busy: "rgba(255,100,100,0.8)",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  open: "Open to offers",
  busy: "Busy",
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
          gigs: {
            where: { status: "active" },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      auth(),
    ]);
  } catch (error) {
    console.error("Profile Page Error:", error);
  }

  if (!user || !user.profileComplete) notFound();

  // Notify profile owner when someone else views (rate: once per hour)
  const viewerId = (session?.user as any)?.userId as string | undefined;
  if (viewerId && viewerId !== user.id) {
    const recentView = await db.notification.findFirst({
      where: {
        userId: user.id,
        type: "profile_view",
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (!recentView) {
      const viewerName = session?.user?.name ?? (session?.user as any)?.twitterHandle ?? "Someone";
      await db.notification.create({
        data: {
          userId: user.id,
          type: "profile_view",
          title: "Someone viewed your profile",
          body: `${viewerName} visited your profile.`,
        },
      });
    }
  }

  const avail = user.availability ?? "available";

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card profile-card" style={{ maxWidth: 720, width: "100%" }}>

          {/* Availability badge */}
          <div className="dash-badge">
            <span
              className="dash-badge-dot"
              style={{
                background: AVAILABILITY_COLORS[avail],
                boxShadow: `0 0 6px ${AVAILABILITY_COLORS[avail]}`,
              }}
            />
            {AVAILABILITY_LABELS[avail]}
          </div>

          {/* Profile header */}
          <div className="profile-header">
            <div className="profile-avatar">
              {user.image ? (
                <img src={user.image} alt={user.name ?? ""} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback" />
              )}
            </div>
            <div className="profile-meta">
              <h1 className="profile-name">{user.name ?? user.twitterHandle}</h1>
              <div className="profile-handle">@{user.twitterHandle}</div>
            </div>
          </div>

          {user.role && <div className="profile-role">{user.role}</div>}
          {user.bio  && <p className="profile-bio">{user.bio}</p>}

          {user.skills.length > 0 && (
            <div className="ob-field">
              <div className="dash-section-label">Skills</div>
              <div className="profile-skills">
                {user.skills.map((s) => (
                  <span key={s} className="dash-skill-chip">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Gigs section */}
          {user.gigs.length > 0 && (
            <>
              <div className="dash-divider" />
              <div className="dash-section-label">Services Offered</div>
              <div className="profile-gigs">
                {user.gigs.map((gig) => (
                  <Link key={gig.id} href={`/gigs/${gig.id}`} className="profile-gig-card">
                    <div className="profile-gig-top">
                      <span className="gig-category-badge" style={{ fontSize: "0.65rem" }}>{gig.category}</span>
                      <span className="gig-price">${gig.price}</span>
                    </div>
                    <div className="profile-gig-title">{gig.title}</div>
                    <div className="profile-gig-meta">{gig.deliveryDays}d delivery</div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="dash-divider" />

          {viewerId && viewerId !== user.id && (
            <form action={startConversation.bind(null, user.id)}>
              <button type="submit" className="btn-primary" style={{ width: "100%", cursor: "pointer" }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
