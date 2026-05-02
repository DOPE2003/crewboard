"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { deleteJob } from "@/actions/jobs";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  company: string;
  budget: string;
  status: string;
  category: string;
  createdAt: string;
  _count: { applications: number };
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function JobRow({ job, onDeleted }: { job: Job; onDeleted: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteJob(job.id);
      onDeleted(job.id);
    });
  }

  return (
    <div style={{
      borderRadius: 12,
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      padding: "1rem 1.25rem",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {job.title}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{job.company}</span>
          <span>·</span>
          <span>{job.budget}</span>
          <span>·</span>
          <span>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>{timeAgo(job.createdAt)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, padding: "3px 9px", borderRadius: 99,
          background: job.status === "open" ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
          color: job.status === "open" ? "#22c55e" : "var(--text-muted)",
          border: `1px solid ${job.status === "open" ? "rgba(34,197,94,0.25)" : "var(--card-border)"}`,
        }}>
          {job.status}
        </span>

        <Link
          href={`/jobs/${job.id}/applicants`}
          style={{
            fontSize: "0.75rem", fontWeight: 600, padding: "6px 12px", borderRadius: 8,
            border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none",
          }}
        >
          Applicants
        </Link>

        <Link
          href={`/jobs/${job.id}/edit`}
          style={{
            fontSize: "0.75rem", fontWeight: 600, padding: "6px 12px", borderRadius: 8,
            background: "#14b8a6", color: "#fff", textDecoration: "none",
          }}
        >
          Edit
        </Link>

        <button
          onClick={handleDelete}
          disabled={isPending}
          style={{
            fontSize: "0.75rem", fontWeight: 600, padding: "6px 12px", borderRadius: 8,
            background: "transparent", color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.3)", cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.5 : 1, fontFamily: "inherit",
          }}
        >
          {isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/jobs/my")
      .then((r) => { if (r.status === 401) { router.replace("/login"); throw new Error(); } return r.json(); })
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  function handleDeleted(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(2rem,5vw,3rem) 1.5rem 6rem" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14b8a6", marginBottom: 4 }}>
              Job Board
            </div>
            <h1 style={{ fontWeight: 800, fontSize: "clamp(1.4rem,4vw,1.8rem)", color: "var(--foreground)", margin: 0 }}>
              My Posted Jobs
            </h1>
          </div>
          <Link
            href="/jobs/new"
            style={{
              fontSize: "0.82rem", fontWeight: 700, padding: "8px 18px", borderRadius: 10,
              background: "#14b8a6", color: "#fff", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(20,184,166,0.25)",
            }}
          >
            + Post a job
          </Link>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</div>
        ) : jobs.length === 0 ? (
          <div style={{ borderRadius: 14, border: "1px solid var(--card-border)", background: "var(--card-bg)", padding: "2.5rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: "0 0 16px" }}>
              You haven&apos;t posted any jobs yet.
            </p>
            <Link href="/jobs/new" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#14b8a6", textDecoration: "none" }}>
              Post your first job →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onDeleted={handleDeleted} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
