import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/app/components/LogoutButton";
import EditProfileForm from "@/app/components/EditProfileForm";
import db from "@/lib/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const dbUser = await db.user.findUnique({
    where: { id: session.user.userId },
  });

  if (!dbUser) redirect("/login");

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 720, width: "100%" }}>

          <div className="dash-badge">
            <span className="dash-badge-dot" />
            Early Access
          </div>

          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title">Dashboard</h1>

          {/* Profile row */}
          <div className="dash-profile">
            <div className="dash-avatar">
              {dbUser.image ? (
                <img className="dash-avatar-img" src={dbUser.image} alt="avatar" />
              ) : (
                <div className="dash-avatar-fallback" />
              )}
            </div>
            <div className="dash-meta">
              <div className="dash-name">{dbUser.name ?? "User"}</div>
              <div className="dash-handle">@{dbUser.twitterHandle}</div>
              <div className="dash-sub">Verified via X · Session active</div>
            </div>
            {dbUser.role && (
              <div className="dash-role-badge">{dbUser.role}</div>
            )}
          </div>

          {dbUser.bio && (
            <p className="dash-bio">{dbUser.bio}</p>
          )}

          {dbUser.skills.length > 0 && (
            <div className="dash-skills">
              {dbUser.skills.map((s: string) => (
                <span key={s} className="dash-skill-chip">{s}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-value">—</div>
              <div className="dash-stat-label">Reputation</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-value">0</div>
              <div className="dash-stat-label">Projects</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-value">0</div>
              <div className="dash-stat-label">Crew</div>
            </div>
          </div>

          <div className="dash-divider" />

          <div className="dash-section-label">Quick Actions</div>
          <div className="dash-actions">
            <Link href="/talent" className="btn-secondary">Explore Talent</Link>
            <Link href="/projects" className="btn-secondary">Browse Projects</Link>
            <Link href={`/u/${dbUser.twitterHandle}`} className="btn-secondary">My Profile</Link>
          </div>

          <div className="dash-divider" />

          <EditProfileForm
            initialRole={dbUser.role ?? ""}
            initialSkills={dbUser.skills}
            initialBio={dbUser.bio ?? ""}
            initialAvailability={dbUser.availability ?? "available"}
          />

          <div className="dash-divider" />

          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
