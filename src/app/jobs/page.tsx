import { auth } from "@/auth";
import db from "@/lib/db";
import Link from "next/link";
import JobBoardClient from "./JobBoardClient";

export const metadata = { title: "Job Board — Crewboard" };

export default async function JobBoardPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const jobs = await db.job.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, twitterHandle: true, image: true } } },
  });

  const openCount = jobs.length;
  const chains = ["ALL", "ETH", "SOL", "BASE", "ARB", "AVAX", "BNB"];

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
              WEB3 · JOB BOARD
            </div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: "var(--foreground)", lineHeight: 1, margin: 0 }}>
              Job Board
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6, marginBottom: 0 }}>
              <span style={{ color: "#14B8A6", fontWeight: 700 }}>{openCount} open</span>
              {" · "}{chains.length - 1} chains{" · "}5 categories
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
            chain: j.chain,
            category: j.category,
            level: j.level,
            jobType: j.jobType,
            tags: j.tags,
            description: j.description,
            milestones: j.milestones,
            createdAt: j.createdAt.toISOString(),
            owner: {
              name: j.owner.name,
              twitterHandle: j.owner.twitterHandle,
              image: j.owner.image,
            },
          }))}
          chains={chains}
          isLoggedIn={isLoggedIn}
        />

      </div>
    </main>
  );
}
