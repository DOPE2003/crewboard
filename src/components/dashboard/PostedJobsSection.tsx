"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteJob } from "@/actions/jobs";

type Job = {
  id: string;
  title: string;
  status: string;
  _count: { applications: number };
};

function DeleteButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete "${jobTitle}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteJob(jobId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      style={{
        fontSize: "0.68rem", fontWeight: 600, padding: "4px 10px", borderRadius: 7,
        background: "transparent", color: "#ef4444",
        border: "1px solid rgba(239,68,68,0.3)",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.5 : 1, fontFamily: "inherit",
      }}
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}

export default function PostedJobsSection({ jobs }: { jobs: Job[] }) {
  return (
    <div style={{ borderRadius: 14, background: "var(--card-bg)", border: "1px solid var(--card-border)", marginBottom: "1.25rem" }}>
      <div style={{
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid var(--card-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>
          My Posted Jobs
        </span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/jobs/new" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
            + Post a job
          </Link>
          <Link href="/jobs/my" style={{ fontSize: "0.65rem", color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>
            View all →
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div style={{ padding: "1.25rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          No jobs posted yet.{" "}
          <Link href="/jobs/new" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>Post your first job →</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {jobs.map((job, i) => (
            <div
              key={job.id}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.75rem 1.25rem",
                borderTop: i > 0 ? "1px solid var(--card-border)" : "none",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/jobs/${job.id}`}
                  style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--foreground)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {job.title}
                </Link>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""} · {job.status}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Link
                  href={`/jobs/${job.id}/applicants`}
                  style={{ fontSize: "0.68rem", fontWeight: 600, padding: "4px 10px", borderRadius: 7, border: "1px solid var(--card-border)", color: "var(--foreground)", textDecoration: "none" }}
                >
                  Applicants
                </Link>
                <Link
                  href={`/jobs/${job.id}/edit`}
                  style={{ fontSize: "0.68rem", fontWeight: 600, padding: "4px 10px", borderRadius: 7, background: "#14b8a6", color: "#fff", textDecoration: "none" }}
                >
                  Edit
                </Link>
                <DeleteButton jobId={job.id} jobTitle={job.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
