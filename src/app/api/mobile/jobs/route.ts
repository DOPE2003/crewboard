/**
 * GET  /api/mobile/jobs   — list open jobs (chain filter, pagination)
 *                           ?mine=1 — return caller's posted jobs (auth required)
 * POST /api/mobile/jobs   — create a job (auth required)
 *
 * GET query params:
 *   ?mine=1               (return caller's own posted jobs — requires auth)
 *   ?chain=ETH            (optional, defaults to all; ignored when mine=1)
 *   ?cursor=<jobId>       (cursor-based pagination)
 *   ?limit=<n>            (default: 20, max: 50)
 *   ?q=<search>           (search title/company/tags)
 *
 * Headers  Authorization: Bearer <token>  (required for POST and ?mine=1)
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser, withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { rateLimit } from "../_lib/rate-limit";
import { fanOutNewJobNotifications } from "@/lib/job-notify";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const mine       = req.nextUrl.searchParams.get("mine") === "1";
  const chain      = req.nextUrl.searchParams.get("chain");
  const cursor     = req.nextUrl.searchParams.get("cursor");
  const q          = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
  const limit      = Math.min(Math.max(1, limitParam), 50);

  // ?mine=1 requires auth
  let callerId: string | null = null;
  if (mine) {
    const user = await getMobileUser(req);
    if (!user) return err("Unauthorized", 401);
    callerId = user.sub;
  }

  try {
    let cursorDate: Date | undefined;
    if (cursor) {
      const pivot = await db.job.findUnique({ where: { id: cursor }, select: { createdAt: true } });
      if (pivot) cursorDate = pivot.createdAt;
    }

    const jobs = await db.job.findMany({
      where: mine && callerId ? {
        ownerId: callerId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      } : {
        status: "open",
        ...(chain && chain !== "ALL" ? { chain } : {}),
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        owner: { select: { name: true, twitterHandle: true, image: true } },
        _count: { select: { applications: true } },
      },
    });

    const nextCursor = jobs.length === limit ? jobs[jobs.length - 1].id : null;

    const data = jobs.map(j => ({
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
      attachments: j.attachments,
      status: j.status,
      createdAt: j.createdAt.toISOString(),
      applicantCount: j._count.applications,
      isOwner: callerId === j.ownerId,
      owner: {
        id: j.ownerId,
        name: j.owner.name,
        twitterHandle: j.owner.twitterHandle,
        image: j.owner.image,
      },
    }));

    return ok(data, { nextCursor });
  } catch (e) {
    console.error("[mobile/jobs GET]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── POST (create job) ────────────────────────────────────────────────────────

async function postHandler(req: NextRequest, user: MobileTokenPayload) {
  // Rate limit: 3 jobs/hour, 10 jobs/day per user
  if (!rateLimit(`job-post-hour:${user.sub}`, 3, 60 * 60 * 1000)) {
    return err("You can only post 3 jobs per hour. Please wait before posting again.", 429);
  }
  if (!rateLimit(`job-post-day:${user.sub}`, 10, 24 * 60 * 60 * 1000)) {
    return err("Daily job post limit reached (10/day).", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      title, company, budget, duration, chain, category,
      level, jobType, tags, description, milestones, attachments,
    } = body as Record<string, any>;

    if (!title?.trim() || !company?.trim() || !budget?.trim() || !description?.trim()) {
      return err("title, company, budget and description are required.");
    }

    const jobCategory = category || "Development";

    // Duplicate detection: same user, same title+company within 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const dupe = await db.job.findFirst({
      where: {
        ownerId: user.sub,
        title: { equals: title.trim(), mode: "insensitive" },
        company: { equals: company.trim(), mode: "insensitive" },
        createdAt: { gte: tenMinAgo },
      },
      select: { id: true },
    });
    if (dupe) return err("Duplicate job detected. Please wait before reposting the same job.", 400);

    const job = await db.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        budget: budget.trim(),
        duration: duration?.trim() || null,
        chain: chain || "ETH",
        category: jobCategory,
        level: level || "Senior",
        jobType: jobType || "Remote",
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
        description: description.trim(),
        milestones: Array.isArray(milestones) && milestones.length > 0
          ? milestones.map((m: any) => ({
              title: String(m.title ?? ""),
              description: String(m.description ?? ""),
              amount: Number(m.amount) || 0,
              status: "pending",
              ...(m.dueDate ? { dueDate: m.dueDate } : {}),
            }))
          : null,
        attachments: Array.isArray(attachments) && attachments.length > 0
          ? attachments.map((a: any) => ({
              name: String(a.name ?? ""),
              type: String(a.type ?? "file"),
              ...(a.url ? { url: a.url } : {}),
            }))
          : null,
        ownerId: user.sub,
      },
    });

    // Fan-out push notifications (fire-and-forget)
    queueMicrotask(() => {
      fanOutNewJobNotifications({
        id: job.id,
        title: job.title,
        company: job.company,
        budget: job.budget,
        category: jobCategory,
        ownerId: user.sub,
      }).catch(e => console.error("[jobs/notify]", e));
    });

    return ok({ id: job.id });
  } catch (e) {
    console.error("[mobile/jobs POST]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(postHandler);
