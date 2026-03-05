import db from "@/lib/db";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

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

  const [user, session] = await Promise.all([
    db.user.findUnique({ where: { twitterHandle: handle } }),
    auth(),
  ]);

  if (!user || !user.profileComplete) notFound();

  // Notify profile owner when someone else views their profile (rate: once per hour)
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
        <div className="auth-card profile-card">

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
              <div className="profile-verified">Verified via X</div>
            </div>
          </div>

          {user.role && (
            <div className="profile-role">{user.role}</div>
          )}

          {user.bio && (
            <p className="profile-bio">{user.bio}</p>
          )}

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

          <div className="dash-divider" />

          <a
            href={`https://x.com/${user.twitterHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary profile-x-link"
          >
            View on X →
          </a>
        </div>
      </section>
    </main>
  );
}
