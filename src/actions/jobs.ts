"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyUser } from "@/lib/notify";
import { fanOutNewJobNotifications } from "@/lib/job-notify";
import { computeProfileScore } from "@/lib/profileScore";

export async function createJob(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const title       = (formData.get("title") as string ?? "").trim();
  const company     = (formData.get("company") as string ?? "").trim();
  const budget      = (formData.get("budget") as string ?? "").trim();
  const duration    = (formData.get("duration") as string ?? "").trim() || null;
  const chain       = (formData.get("chain") as string) || "ETH";
  const category    = (formData.get("category") as string) || "Development";
  const level       = (formData.get("level") as string) || "Senior";
  const jobType     = (formData.get("jobType") as string) || "Remote";
  const tagsRaw     = (formData.get("tags") as string ?? "").trim();
  const description = (formData.get("description") as string ?? "").trim();
  const milestones  = formData.get("milestones") === "true";

  if (!title || !company || !budget || !description) {
    throw new Error("Title, company, budget and description are required.");
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const job = await db.job.create({
    data: { title, company, budget, duration, chain, category, level, jobType, tags, description, milestones, ownerId: userId },
  });

  fanOutNewJobNotifications({ id: job.id, title: job.title, company: job.company, budget: job.budget, category: job.category, ownerId: userId }).catch(() => {});

  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function applyToJob(jobId: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect(`/login?next=/jobs/${jobId}/apply`);

  const coverLetter  = (formData.get("coverLetter") as string ?? "").trim();
  const proposedRate = (formData.get("proposedRate") as string ?? "").trim() || null;
  const portfolioURL = (formData.get("portfolioURL") as string ?? "").trim() || null;

  if (!coverLetter || coverLetter.length < 40)
    return { error: "Cover letter must be at least 40 characters." };
  if (coverLetter.length > 2000)
    return { error: "Cover letter must be under 2000 characters." };

  const [job, applicant] = await Promise.all([
    db.job.findUnique({
      where: { id: jobId },
      select: { id: true, ownerId: true, status: true, title: true, company: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, twitterHandle: true, image: true,
        bio: true, skills: true, walletAddress: true, profileComplete: true,
        _count: { select: { gigs: true } },
      },
    }),
  ]);

  if (!job || job.status !== "open") return { error: "This job is no longer accepting applications." };
  if (job.ownerId === userId) return { error: "You cannot apply to your own job." };
  if (!applicant) return { error: "User not found." };

  if (!applicant.profileComplete) {
    const score = computeProfileScore({
      bio: applicant.bio,
      image: applicant.image,
      skills: applicant.skills,
      gigCount: applicant._count.gigs,
      walletAddress: applicant.walletAddress,
    });
    if (!score.meetsThreshold) {
      const missing = [
        !score.breakdown.bio      && "bio",
        !score.breakdown.avatar   && "profile image",
        !score.breakdown.skills   && "skills",
        !score.breakdown.services && "at least one service",
        !score.breakdown.wallet   && "wallet",
      ].filter(Boolean).join(", ");
      return { error: `Complete your profile before applying. Missing: ${missing}.` };
    }
  }

  try {
    await db.jobApplication.create({
      data: { jobId, applicantId: userId, coverLetter, proposedRate, portfolioURL },
    });
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "You have already applied to this job." };
    throw e;
  }

  const applicantName = applicant.name ?? applicant.twitterHandle ?? "Someone";
  notifyUser({
    userId: job.ownerId,
    type: "application",
    title: `New application from ${applicantName}`,
    body: `${job.title} at ${job.company}`,
    link: `/jobs/${jobId}/edit`,
    actionUrl: `crewboard://job/${jobId}/applications`,
  }).catch(() => {});

  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}?applied=1`);
}

export async function updateJob(id: string, formData: FormData) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const title       = (formData.get("title") as string ?? "").trim();
  const company     = (formData.get("company") as string ?? "").trim();
  const budget      = (formData.get("budget") as string ?? "").trim();
  const description = (formData.get("description") as string ?? "").trim();
  const category    = (formData.get("category") as string) || "Development";
  const tagsRaw     = (formData.get("tags") as string ?? "").trim();

  if (!title || !company || !budget || !description)
    throw new Error("Title, company, budget and description are required.");

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const updated = await db.job.updateMany({
    where: { id, ownerId: userId },
    data: { title, company, budget, description, category, tags },
  });

  if (updated.count === 0) throw new Error("Job not found or you don't have permission.");

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs/my");
  redirect(`/jobs/${id}`);
}

export async function deleteJob(id: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { ok: false };
  await db.job.deleteMany({ where: { id, ownerId: userId } });
  revalidatePath("/jobs");
  revalidatePath("/jobs/my");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function acceptApplication(appId: string): Promise<{ ok: boolean; applicantId?: string; error?: string }> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { ok: false, error: "Not logged in." };

  const app = await db.jobApplication.findUnique({
    where: { id: appId },
    include: { job: { select: { id: true, title: true, ownerId: true, status: true } } },
  });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.job.ownerId !== userId) return { ok: false, error: "Not your job." };
  if (app.job.status !== "open") return { ok: false, error: "Job is no longer open." };

  // Accept this application, reject all others for this job
  await db.$transaction([
    db.jobApplication.update({ where: { id: appId }, data: { status: "accepted" } }),
    db.jobApplication.updateMany({
      where: { jobId: app.jobId, id: { not: appId }, status: { not: "accepted" } },
      data: { status: "rejected" },
    }),
    db.job.update({ where: { id: app.jobId }, data: { status: "in_progress", acceptedApplicantId: app.applicantId } }),
  ]);

  // Notify accepted applicant
  notifyUser({
    userId: app.applicantId,
    type: "application_accepted",
    title: "Application Accepted!",
    body: `Your application for "${app.job.title}" was accepted. The client will send you an offer to start.`,
    link: `/jobs/${app.jobId}`,
    actionUrl: `crewboard://job/${app.jobId}`,
  }).catch(() => {});

  // Notify rejected applicants
  const rejected = await db.jobApplication.findMany({
    where: { jobId: app.jobId, id: { not: appId } },
    select: { applicantId: true },
  });
  for (const r of rejected) {
    notifyUser({
      userId: r.applicantId,
      type: "offer_declined",
      title: "Application not selected",
      body: `The position for "${app.job.title}" has been filled.`,
      link: `/jobs`,
    }).catch(() => {});
  }

  revalidatePath(`/jobs/${app.jobId}/applicants`);
  revalidatePath(`/jobs/${app.jobId}`);
  return { ok: true, applicantId: app.applicantId };
}

export async function rejectApplication(appId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { ok: false, error: "Not logged in." };

  const app = await db.jobApplication.findUnique({
    where: { id: appId },
    include: { job: { select: { id: true, title: true, ownerId: true } } },
  });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.job.ownerId !== userId) return { ok: false, error: "Not your job." };

  await db.jobApplication.update({ where: { id: appId }, data: { status: "rejected" } });

  notifyUser({
    userId: app.applicantId,
    type: "offer_declined",
    title: "Application not selected",
    body: `Your application for "${app.job.title}" was not selected.`,
    link: `/jobs`,
  }).catch(() => {});

  revalidatePath(`/jobs/${app.jobId}/applicants`);
  return { ok: true };
}
