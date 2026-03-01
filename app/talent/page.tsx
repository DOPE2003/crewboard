import db from "@/lib/db";
import Link from "next/link";

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

export default async function TalentPage() {
  const users = await db.user.findMany({
    where: { profileComplete: true },
    orderBy: { createdAt: "desc" },
    select: {
      twitterHandle: true,
      name: true,
      image: true,
      role: true,
      skills: true,
      availability: true,
      bio: true,
    },
  });

  return (
    <main className="page">
      <section className="talent-wrap">
        <div className="talent-header">
          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title">Talent</h1>
          <p className="auth-sub">Verified Web3 builders, ready to crew up.</p>
        </div>

        {users.length === 0 ? (
          <div className="talent-empty">
            <p>No builders here yet — be the first.</p>
            <Link href="/dashboard" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="talent-grid">
            {users.map((user: typeof users[number]) => {
              const avail = user.availability ?? "available";
              return (
                <Link
                  key={user.twitterHandle}
                  href={`/u/${user.twitterHandle}`}
                  className="talent-card"
                >
                  <div className="talent-card-top">
                    <div className="talent-avatar">
                      {user.image ? (
                        <img src={user.image} alt={user.name ?? ""} className="talent-avatar-img" />
                      ) : (
                        <div className="talent-avatar-fallback" />
                      )}
                    </div>
                    <div className="talent-card-meta">
                      <div className="talent-name">{user.name ?? user.twitterHandle}</div>
                      <div className="talent-handle">@{user.twitterHandle}</div>
                      {user.role && <div className="talent-role">{user.role}</div>}
                    </div>
                    <span
                      className="talent-avail-dot"
                      style={{
                        background: AVAILABILITY_COLORS[avail],
                        boxShadow: `0 0 6px ${AVAILABILITY_COLORS[avail]}`,
                      }}
                      title={AVAILABILITY_LABELS[avail]}
                    />
                  </div>

                  {user.bio && (
                    <p className="talent-bio">{user.bio}</p>
                  )}

                  {user.skills.length > 0 && (
                    <div className="talent-skills">
                      {user.skills.slice(0, 5).map((s: string) => (
                        <span key={s} className="talent-skill-chip">{s}</span>
                      ))}
                      {user.skills.length > 5 && (
                        <span className="talent-skill-chip talent-skill-more">+{user.skills.length - 5}</span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
