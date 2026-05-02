import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";
import ApplyForm from "./ApplyForm";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const session = await auth();
  const userId = (session?.user as any)?.userId ?? null;

  if (!userId) redirect(`/login?callbackUrl=/jobs/${id}/apply`);

  const job = await db.job.findUnique({
    where: { id },
    select: {
      id: true, title: true, company: true, budget: true,
      status: true, ownerId: true,
    },
  });

  if (!job) notFound();
  if (job.ownerId === userId) redirect(`/jobs/${id}`);
  if (job.status !== "open") redirect(`/jobs/${id}`);

  const existing = await db.jobApplication.findUnique({
    where: { jobId_applicantId: { jobId: id, applicantId: userId } },
    select: { id: true },
  });
  if (existing) redirect(`/jobs/${id}?applied=1`);

  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        <Link
          href={`/jobs/${id}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 14, textDecoration: "none", marginBottom: 28 }}
        >
          ← Back to Job
        </Link>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 28px 32px" }}>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              Applying to
            </div>
            <h1 style={{ margin: "0 0 4px", fontSize: "clamp(1.1rem,2.5vw,1.4rem)", fontWeight: 800, color: "var(--foreground)" }}>
              {job.title}
            </h1>
            <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
              {job.company} · {job.budget}
            </div>
          </div>

          <ApplyForm jobId={id} serverError={error} />

        </div>
      </div>
    </main>
  );
}
