import db from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import T from "@/components/ui/T";

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "#22c55e",
  open: "#f59e0b",
  busy: "#ef4444",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  open: "Open to offers",
  busy: "Busy",
};

export default async function SavedTalentsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const saved = await db.savedTalent.findMany({
    where: { saverId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      savedUser: {
        select: {
          id: true,
          twitterHandle: true,
          name: true,
          image: true,
          userTitle: true,
          skills: true,
          availability: true,
          bio: true,
        },
      },
    },
  });

  return (
    <main className="page">
      <section className="talent-wrap">
        <div className="talent-header">
          <div className="auth-kicker"><T k="saved.kicker" /></div>
          <h1 className="auth-title"><T k="saved.title" /></h1>
          <p className="auth-sub"><T k="saved.subtitle" /></p>
        </div>

        {saved.length === 0 ? (
          <div className="talent-empty">
            <p><T k="saved.empty" /></p>
            <Link href="/talent" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
              <T k="saved.browse" />
            </Link>
          </div>
        ) : (
          <div className="talent-grid">
            {saved.map(({ savedUser: u }) => {
              const avail = u.availability ?? "available";
              const color = AVAILABILITY_COLORS[avail] ?? "#94a3b8";
              const label = AVAILABILITY_LABELS[avail] ?? avail;
              return (
                <Link key={u.id} href={`/u/${u.twitterHandle}`} className="talent-card">
                  <div className="talent-card-top">
                    <div className="talent-avatar-wrap">
                      {u.image
                        ? <img src={u.image} alt={u.name ?? ""} className="talent-avatar" />
                        : <div className="talent-avatar-fallback" />}
                    </div>
                    <span className="talent-avail-dot" style={{ background: color }} title={label} />
                  </div>
                  <div className="talent-name">{u.name ?? u.twitterHandle}</div>
                  <div className="talent-handle">@{u.twitterHandle}</div>
                  {u.userTitle && <div className="talent-role-badge">{u.userTitle}</div>}
                  {u.bio && <p className="talent-bio">{u.bio}</p>}
                  {u.skills.length > 0 && (
                    <div className="talent-skills">
                      {u.skills.slice(0, 4).map((s) => (
                        <span key={s} className="talent-skill-chip">{s}</span>
                      ))}
                      {u.skills.length > 4 && (
                        <span className="talent-skill-chip">+{u.skills.length - 4}</span>
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
