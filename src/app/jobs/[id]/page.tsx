import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await db.job.findUnique({
    where: { id },
    select: { title: true, company: true, budget: true, level: true, owner: { select: { image: true } } },
  });
  if (!job) return { title: "Job Not Found — Crewboard" };

  return {
    title: `${job.title} at ${job.company} — Crewboard`,
    description: `${job.company} · ${job.budget} · ${job.level}`,
    openGraph: {
      title: `Hiring: ${job.title}`,
      description: `${job.company} · ${job.budget} · ${job.level}`,
      url: `${BASE_URL}/jobs/${id}`,
      type: "website",
      images: job.owner.image ? [{ url: job.owner.image }] : [{ url: `${BASE_URL}/og/default.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Hiring: ${job.title}`,
      description: `${job.company} · ${job.budget} · ${job.level}`,
    },
  };
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ applied?: string }>;
}) {
  const { id } = await params;
  const { applied } = await searchParams;

  const [job, session] = await Promise.all([
    db.job.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, twitterHandle: true, image: true } },
        _count: { select: { applications: true } },
      },
    }),
    auth(),
  ]);

  if (!job) notFound();

  const userId = (session?.user as any)?.userId ?? null;
  const isOwner = userId === job.ownerId;
  const isLoggedIn = !!userId;

  // Check if current user already applied
  let alreadyApplied = false;
  if (isLoggedIn && !isOwner) {
    const existing = await db.jobApplication.findUnique({
      where: { jobId_applicantId: { jobId: id, applicantId: userId } },
      select: { id: true },
    });
    alreadyApplied = !!existing;
  }

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        {/* Back */}
        <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, textDecoration: "none", marginBottom: 24 }}>
          ← Back to Job Board
        </Link>

        {applied === "1" && (
          <div style={{ marginBottom: 20, padding: "0.85rem 1.1rem", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 14, color: "#22c55e", fontWeight: 600 }}>
            Application submitted! The poster will review it and reach out if there&apos;s a match.
          </div>
        )}

        {/* Header card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            {job.owner.image ? (
              <img src={job.owner.image} alt={job.owner.name ?? job.owner.twitterHandle} style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {(job.owner.name ?? job.owner.twitterHandle)[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: "0 0 4px", fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 700, color: "var(--foreground)" }}>{job.title}</h1>
              <div style={{ fontSize: 14, color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Link href={`/u/${job.owner.twitterHandle}`} style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                  @{job.owner.twitterHandle}
                </Link>
                <span>·</span>
                <span>{job.company}</span>
                <span>·</span>
                <span>{timeAgo(job.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Meta pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            {[
              { label: job.budget, color: "#22c55e" },
              { label: job.level },
              { label: job.jobType },
              { label: job.category },
              ...(job.duration ? [{ label: job.duration }] : []),
            ].map(({ label, color }) => (
              <span key={label} style={{
                fontSize: 12, fontWeight: 600, padding: "4px 10px",
                borderRadius: 999, border: "1px solid var(--border)",
                background: "var(--bg-secondary)", color: color ?? "var(--foreground)",
              }}>
                {label}
              </span>
            ))}
            {job.milestones && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                Milestone payments
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 28px", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Job Description</h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{job.description}</p>
        </div>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 28px", marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>Skills & Tags</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {job.tags.map(tag => (
                <span key={tag} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {isOwner ? (
            <>
              <Link href={`/jobs/${id}/edit`} style={{ padding: "12px 24px", borderRadius: 10, background: "var(--brand)", color: "#0f172a", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Manage Applicants ({job._count.applications})
              </Link>
              <Link href="/jobs" style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--foreground)", fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
                Back to Board
              </Link>
            </>
          ) : isLoggedIn ? (
            alreadyApplied ? (
              <div style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 15, fontWeight: 600 }}>
                Applied
              </div>
            ) : job.status === "open" ? (
              <Link href={`/jobs/${id}/apply`} style={{ padding: "12px 28px", borderRadius: 10, background: "var(--brand)", color: "#0f172a", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Apply Now
              </Link>
            ) : (
              <div style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 15 }}>
                Position filled
              </div>
            )
          ) : (
            <Link href={`/login?next=/jobs/${id}`} style={{ padding: "12px 28px", borderRadius: 10, background: "var(--brand)", color: "#0f172a", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              Sign in to Apply
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}
