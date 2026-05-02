import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  reviewed:  { label: "Reviewed",  color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  shortlist: { label: "Shortlisted", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  rejected:  { label: "Rejected",  color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
};

export default async function MyApplicationsPage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId ?? (session?.user as any)?.id ?? null;
  if (!userId) redirect("/login?callbackUrl=/jobs/applied");

  const applications = await db.jobApplication.findMany({
    where: { applicantId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true, title: true, company: true, budget: true, status: true,
          owner: { select: { name: true, twitterHandle: true, image: true } },
        },
      },
    },
  });

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, textDecoration: "none", marginBottom: 28 }}>
          ← Job Board
        </Link>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            My Applications
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: "clamp(1.2rem,3vw,1.7rem)", fontWeight: 800, color: "var(--foreground)" }}>
            Jobs You Applied To
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            {applications.length} application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", border: "1px dashed var(--card-border)", borderRadius: 16, color: "var(--text-muted)" }}>
            <p style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 8px", color: "var(--foreground)" }}>No applications yet</p>
            <p style={{ fontSize: 13, margin: "0 0 20px" }}>Browse open jobs and apply to get started.</p>
            <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 10, background: "var(--brand)", color: "#0f172a", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              Browse Jobs →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {applications.map((app) => {
              const st = STATUS_STYLE[app.status] ?? STATUS_STYLE.pending;
              const poster = app.job.owner.name ?? `@${app.job.owner.twitterHandle}`;

              return (
                <div key={app.id} style={{
                  background: "var(--dropdown-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  {/* Job info + status */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/jobs/${app.job.id}`} style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", textDecoration: "none", display: "block" }}>
                        {app.job.title}
                      </Link>
                      <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                        {app.job.company} · {app.job.budget} · Posted by {poster}
                      </p>
                    </div>
                    <span style={{
                      flexShrink: 0,
                      padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                      color: st.color, background: st.bg,
                    }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Cover letter preview */}
                  <p style={{
                    margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {app.coverLetter}
                  </p>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                    <span>Applied {timeAgo(app.createdAt)}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      {app.portfolioURL && (
                        <a href={app.portfolioURL} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                          Portfolio ↗
                        </a>
                      )}
                      <Link href={`/jobs/${app.job.id}`} style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                        View Job
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
