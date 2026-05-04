/**
 * POST /api/mobile/jobs/:id/applications  — apply to a job
 * GET  /api/mobile/jobs/:id/applications  — list applicants (owner only)
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import { rateLimit } from "../../../_lib/rate-limit";
import { computeProfileScore } from "@/lib/profileScore";
import { sendPush } from "@/lib/push";
import { notifyUser } from "@/lib/notify";

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const { id: jobId } = await params;

  // Rate limits: 5/hr, 20/day
  if (!rateLimit(`apply-hour:${user.sub}`, 5, 60 * 60 * 1000))
    return err("Too many applications. Please wait before applying again.", 429);
  if (!rateLimit(`apply-day:${user.sub}`, 20, 24 * 60 * 60 * 1000))
    return err("Daily application limit reached.", 429);

  try {
    const body = await req.json().catch(() => ({}));
    const coverLetter  = (body?.coverLetter  as string | undefined)?.trim() ?? "";
    const proposedRate = (body?.proposedRate as string | undefined)?.trim() || null;
    const portfolioURL = (body?.portfolioURL as string | undefined)?.trim() || null;

    if (!coverLetter || coverLetter.length < 40)
      return err("Cover letter must be at least 40 characters.");
    if (coverLetter.length > 2000)
      return err("Cover letter must be under 2000 characters.");

    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { id: true, ownerId: true, status: true, title: true, company: true },
    });
    if (!job || job.status !== "open") return err("not_found", 404);
    if (job.ownerId === user.sub) return err("cannot_apply_to_own_job", 403);

    // Profile complete gate
    const applicant = await db.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true, name: true, twitterHandle: true, image: true,
        bio: true, skills: true, walletAddress: true, profileComplete: true,
        _count: { select: { gigs: true } },
      },
    });
    if (!applicant) return err("Unauthorized", 401);

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
          !score.breakdown.avatar   && "image",
          !score.breakdown.skills   && "skills",
          !score.breakdown.services && "at least one service",
          !score.breakdown.wallet   && "wallet",
        ].filter(Boolean).join(", ");
        return err("profile_incomplete", 403, { reason: missing });
      }
    }

    // Anti-spam: same cover letter prefix (first 100 chars) to >3 jobs in 24h
    const coverPrefix = coverLetter.slice(0, 100);
    // Approximate check via rateLimit key hashed on prefix
    const prefixKey = `apply-dupe:${user.sub}:${coverPrefix.replace(/\s+/g, "").slice(0, 40)}`;
    if (!rateLimit(prefixKey, 3, 24 * 60 * 60 * 1000)) {
      return err("Identical cover letter submitted too many times today. Please personalise your application.", 429);
    }

    const application = await db.jobApplication.create({
      data: { jobId, applicantId: user.sub, coverLetter, proposedRate, portfolioURL },
      select: { id: true, status: true, createdAt: true },
    });

    // Notify job owner
    const applicantName = applicant.name ?? applicant.twitterHandle ?? "Someone";
    const notifBody = `${applicantName} applied to "${job.title}"`;
    notifyUser({
      userId: job.ownerId,
      senderId: user.sub,
      type: "application",
      title: "New application",
      body: notifBody,
      link: `/jobs/${jobId}`,
      actionUrl: `crewboard://job/${jobId}/applications`,
      messageId: `application:${application.id}`,
    }).catch(() => {});

    sendPush({
      userId: job.ownerId,
      title: "New application",
      body: notifBody,
      data: { type: "application", jobId, applicantId: user.sub, actionUrl: `crewboard://job/${jobId}/applications` },
    }).catch(() => {});

    return ok({ id: application.id, status: application.status, createdAt: application.createdAt });
  } catch (e: any) {
    if (e?.code === "P2002") return err("already_applied", 409);
    console.error("[mobile/jobs/:id/applications POST]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const { id: jobId } = await params;
  const statusFilter = req.nextUrl.searchParams.get("status");

  try {
    const job = await db.job.findUnique({ where: { id: jobId }, select: { ownerId: true } });
    if (!job) return err("not_found", 404);
    if (job.ownerId !== user.sub) return err("Forbidden.", 403);

    const applications = await db.jobApplication.findMany({
      where: {
        jobId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, jobId: true, status: true, coverLetter: true,
        proposedRate: true, portfolioURL: true, createdAt: true,
        applicant: {
          select: {
            id: true, name: true, twitterHandle: true, image: true,
            userTitle: true, bio: true, skills: true, profileComplete: true,
          },
        },
      },
    });

    return ok(applications);
  } catch (e) {
    console.error("[mobile/jobs/:id/applications GET]", e);
    return err("Something went wrong.", 500);
  }
}
