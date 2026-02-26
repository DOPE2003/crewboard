// app/dashboard/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LogoutButton from "@/app/components/LogoutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const user = session.user;

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card">
          <div className="auth-kicker">— DASHBOARD</div>

          <h1 className="auth-title">Dashboard</h1>

          <p className="auth-sub">
            You’re logged in with X. This profile will be shown publicly on Crewboard.
          </p>

          <div className="dash-profile">
            <div className="dash-avatar">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Profile image"
                  width={56}
                  height={56}
                  className="dash-avatar-img"
                />
              ) : (
                <div className="dash-avatar-fallback" />
              )}
            </div>

            <div className="dash-meta">
              <div className="dash-name">{user?.name ?? "Unknown"}</div>
              <div className="dash-sub">Authenticated via X</div>
            </div>
          </div>

          <div className="dash-actions">
            <a className="btn-secondary" href="/">
              Back to Home
            </a>

            <LogoutButton />
          </div>
        </div>
      </section>
    </main>
  );
}