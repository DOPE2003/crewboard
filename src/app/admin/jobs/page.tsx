import { requireAdmin } from "@/lib/auth-utils";
import db from "@/lib/db";
import Link from "next/link";
import { JobAdminActions } from "./JobAdminActions";

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q = "", status = "all" } = await searchParams;

  const jobs = await db.job.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(q ? {
        OR: [
          { title:    { contains: q, mode: "insensitive" } },
          { company:  { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { name: true, twitterHandle: true } },
      _count: { select: { applications: true } },
    },
  });

  const statusColors: Record<string, { bg: string; color: string }> = {
    open:   { bg: "rgba(34,197,94,0.1)",  color: "#22c55e" },
    closed: { bg: "rgba(239,68,68,0.1)",  color: "#ef4444" },
  };

  return (
    <main className="page" style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div className="admin-content">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: "#f59e0b", marginBottom: "0.5rem", fontWeight: 700 }}>— JOBS</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)" }}>Job Management</h1>
          </div>
          <Link href="/admin" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>← Dashboard</Link>
        </div>

        <form style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <input name="q" defaultValue={q} placeholder="Search title, company or category…"
            style={{ flex: 1, minWidth: 200, padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.85rem", outline: "none" }} />
          <select name="status" defaultValue={status}
            style={{ padding: "0.75rem 1rem", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", fontSize: "0.85rem", cursor: "pointer" }}>
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <button type="submit" style={{ padding: "0.75rem 1.25rem", borderRadius: 10, background: "#f59e0b", border: "none", color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
            Filter
          </button>
        </form>

        <div style={{ background: "var(--card-bg)", borderRadius: 16, border: "1px solid var(--card-border)", overflow: "hidden" }}>
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--foreground)" }}>{jobs.length} job{jobs.length !== 1 ? "s" : ""}</span>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No jobs found.</div>
          ) : (
            <div className="admin-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "rgba(var(--foreground-rgb),0.02)", textAlign: "left" }}>
                    {["Job", "Posted by", "Category", "Budget", "Status", "Apps", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap", fontSize: "0.75rem" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const sc = statusColors[job.status] ?? { bg: "rgba(0,0,0,0.04)", color: "var(--text-muted)" };
                    return (
                      <tr key={job.id} style={{ borderTop: "1px solid var(--card-border)" }}>
                        <td style={{ padding: "0.9rem 1.25rem", maxWidth: 240 }}>
                          <Link href={`/jobs/${job.id}`} style={{ fontWeight: 600, color: "var(--foreground)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {job.title}
                          </Link>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{job.company}</div>
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem" }}>
                          <Link href={`/u/${job.owner.twitterHandle}`} style={{ color: "#14b8a6", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                            @{job.owner.twitterHandle}
                          </Link>
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>{job.category}</td>
                        <td style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--foreground)", whiteSpace: "nowrap" }}>{job.budget}</td>
                        <td style={{ padding: "0.9rem 1.25rem" }}>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.color }}>
                            {job.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--foreground)", textAlign: "center" }}>
                          <Link href={`/jobs/${job.id}/edit`} style={{ color: "#6366f1", textDecoration: "none", fontWeight: 700, fontSize: "0.85rem" }}>
                            {job._count.applications}
                          </Link>
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem" }}>
                          <JobAdminActions jobId={job.id} status={job.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
