import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 720, width: "100%" }}>
          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title" style={{ marginBottom: 10 }}>
            Dashboard
          </h1>

          <p className="auth-sub" style={{ marginBottom: 24 }}>
            Logged in as <strong>{session.user.name ?? "User"}</strong>
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {/* Use normal img to avoid next/image host config headaches */}
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="avatar"
                width={44}
                height={44}
                style={{ borderRadius: 999, opacity: 0.95 }}
              />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 999, background: "rgba(255,255,255,0.08)" }} />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontWeight: 700, letterSpacing: 0.2 }}>
                {session.user.name ?? "User"}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Session active — refresh the page, you should stay logged in.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}