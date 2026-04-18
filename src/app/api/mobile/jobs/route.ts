/**
 * GET  /api/mobile/jobs   — list open jobs (chain filter, pagination)
 * POST /api/mobile/jobs   — create a job (auth required)
 *
 * GET query params:
 *   ?chain=ETH            (optional, defaults to all)
 *   ?cursor=<jobId>       (cursor-based pagination)
 *   ?limit=<n>            (default: 20, max: 50)
 *   ?q=<search>           (search title/company/tags)
 *
 * Headers  Authorization: Bearer <token>  (required for POST, optional for GET)
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser, withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const chain     = req.nextUrl.searchParams.get("chain");
  const cursor    = req.nextUrl.searchParams.get("cursor");
  const q         = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "20");
  const limit     = Math.min(Math.max(1, limitParam), 50);

  try {
    let cursorDate: Date | undefined;
    if (cursor) {
      const pivot = await db.job.findUnique({ where: { id: cursor }, select: { createdAt: true } });
      if (pivot) cursorDate = pivot.createdAt;
    }

    const jobs = await db.job.findMany({
      where: {
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
      createdAt: j.createdAt.toISOString(),
      owner: {
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
  try {
    const body = await req.json().catch(() => ({}));
    const {
      title, company, budget, duration, chain, category,
      level, jobType, tags, description, milestones,
    } = body as Record<string, any>;

    if (!title?.trim() || !company?.trim() || !budget?.trim() || !description?.trim()) {
      return err("title, company, budget and description are required.");
    }

    const job = await db.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        budget: budget.trim(),
        duration: duration?.trim() || null,
        chain: chain || "ETH",
        category: category || "Development",
        level: level || "Senior",
        jobType: jobType || "Remote",
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
        description: description.trim(),
        milestones: !!milestones,
        ownerId: user.sub,
      },
    });

    return ok({ id: job.id });
  } catch (e) {
    console.error("[mobile/jobs POST]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(postHandler);
