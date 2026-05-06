import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import ApplicationActions from "./ApplicationActions";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "New",       color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  reviewed:  { label: "Reviewed",  color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  shortlist: { label: "Shortlist", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  rejected:  { label: "Rejected",  color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
};

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  const userId = (session?.user as any)?.userId ?? (session?.user as any)?.id ?? null;
  if (!userId) redirect(`/login?callbackUrl=/jobs/${id}/applicants`);

  const job = await db.job.findUnique({
    where: { id },
    select: {
      id: true, title: true, company: true, budget: true,
      status: true, ownerId: true, acceptedApplicantId: true,
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          applicant: {
            select: {
              id: true, name: true, twitterHandle: true, image: true,
              bio: true, skills: true,
            },
          },
        },
      },
    },
  });

  if (!job) notFound();
  if (job.ownerId !== userId) redirect(`/jobs/${id}`);

  const apps = job.applications;

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        {/* Back + header */}
        <Link
          href={`/jobs/${id}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, textDecoration: "none", marginBottom: 28 }}
        >
          ← Back to Job
        </Link>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            Applications
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: "clamp(1.2rem,3vw,1.7rem)", fontWeight: 800, color: "var(--foreground)" }}>
            {job.title}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            {job.company} · {job.budget} · {apps.length} applicant{apps.length !== 1 ? "s" : ""}
          </p>
        </div>

        {apps.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            border: "1px dashed var(--card-border)", borderRadius: 16,
            color: "var(--text-muted)",
          }}>
            <p style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 8px", color: "var(--foreground)" }}>No applications yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Share the job listing to attract freelancers.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {apps.map((app) => {
              const handle = app.applicant.twitterHandle;
              const name   = app.applicant.name ?? `@${handle}`;
              const st     = STATUS_STYLE[app.status] ?? STATUS_STYLE.pending;

              return (
                <div key={app.id} style={{
                  background: "var(--dropdown-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 14,
                  padding: "20px 22px",
                  display: "flex", flexDirection: "column", gap: 14,
                }}>

                  {/* Applicant header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {app.applicant.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={app.applicant.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                          {name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/u/${handle}`} style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)", textDecoration: "none" }}>
                          {name}
                        </Link>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                          @{handle} · Applied {timeAgo(app.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        href={`/messages?with=${app.applicant.id}`}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: "var(--card-bg)", color: "var(--text-muted)",
                          border: "1px solid var(--card-border)",
                          textDecoration: "none", whiteSpace: "nowrap",
                        }}
                      >
                        Message
                      </Link>
                      <ApplicationActions
                        appId={app.id}
                        applicantId={app.applicant.id}
                        applicantHandle={handle ?? ""}
                        initialStatus={app.status}
                        jobStatus={job.status}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  {app.applicant.skills && app.applicant.skills.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {app.applicant.skills.slice(0, 6).map((s: string) => (
                        <span key={s} style={{
                          padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: "1px solid var(--card-border)", color: "var(--text-muted)",
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cover letter */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)", borderRadius: 10,
                    border: "1px solid var(--card-border)", padding: "14px 16px",
                  }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Cover Letter
                    </p>
                    <p style={{ margin: 0, fontSize: 14, color: "var(--foreground)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {app.coverLetter}
                    </p>
                  </div>

                  {/* Proposed rate + portfolio */}
                  {(app.proposedRate || app.portfolioURL) && (
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                      {app.proposedRate && (
                        <span style={{ color: "var(--text-muted)" }}>
                          <strong style={{ color: "var(--foreground)" }}>Rate:</strong> {app.proposedRate}
                        </span>
                      )}
                      {app.portfolioURL && (
                        <a href={app.portfolioURL} target="_blank" rel="noopener noreferrer"
                          style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                          Portfolio ↗
                        </a>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
