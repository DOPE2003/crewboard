import { auth } from "@/auth";
import db from "@/lib/db";
import Link from "next/link";
import JobBoardClient from "./JobBoardClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Job Board — Crewboard" };

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ mine?: string }>;
}) {
  const { mine } = await searchParams;
  const session = await auth();
  const userId = (session?.user as any)?.userId ?? null;
  const isLoggedIn = !!userId;
  const isMineFilter = mine === "1" && !!userId;

  const jobs = await db.job.findMany({
    where: isMineFilter ? { ownerId: userId } : { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, twitterHandle: true, image: true } },
      _count: { select: { applications: true } },
    },
  });

  const openCount = jobs.length;

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 2rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              WEB3 · JOB BOARD
            </div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: "var(--foreground)", lineHeight: 1, margin: 0 }}>
              {isMineFilter ? "My Posted Jobs" : "Job Board"}
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6, marginBottom: 0 }}>
              <span style={{ color: "#14B8A6", fontWeight: 700 }}>{openCount} {isMineFilter ? "posted" : "open"}</span>
              {isMineFilter ? (
                <> · <a href="/jobs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>View all jobs →</a></>
              ) : (
                " · Web3 freelance opportunities"
              )}
            </p>
          </div>
          <Link
            href={isLoggedIn ? "/jobs/new" : "/login"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#14B8A6", color: "#fff",
              fontFamily: "Inter, sans-serif", fontWeight: 700,
              fontSize: "0.8rem", letterSpacing: "0.04em",
              padding: "10px 20px", borderRadius: 12,
              textDecoration: "none", flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Post Job
          </Link>
        </div>

        <JobBoardClient
          jobs={jobs.map(j => ({
            id: j.id,
            title: j.title,
            company: j.company,
            budget: j.budget,
            duration: j.duration,
            category: j.category,
            level: j.level,
            jobType: j.jobType,
            tags: j.tags,
            description: j.description,
            milestones: j.milestones,
            status: j.status,
            createdAt: j.createdAt.toISOString(),
            ownerId: j.ownerId,
            applicantCount: j._count.applications,
            owner: {
              name: j.owner.name,
              twitterHandle: j.owner.twitterHandle,
              image: j.owner.image,
            },
          }))}
          isLoggedIn={isLoggedIn}
          currentUserId={userId ?? null}
        />

      </div>
    </main>
  );
}
