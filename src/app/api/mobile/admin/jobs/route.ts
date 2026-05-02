/**
 * GET  /api/mobile/admin/jobs  — paginated list of all jobs (ADMIN+)
 * PATCH /api/mobile/admin/jobs  — close/reopen/delete a job (ADMIN+)
 *
 * GET  query: status ("open"|"closed"|omit for all), cursor, limit
 * PATCH body: { id, action: "close" | "reopen" | "delete" }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withAdminAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { logAdminAction } from "@/lib/audit";

async function getHandler(req: NextRequest, _user: MobileTokenPayload) {
  try {
    const sp     = req.nextUrl.searchParams;
    const status = sp.get("status") ?? undefined;
    const cursor = sp.get("cursor") ?? undefined;
    const limit  = Math.min(Number(sp.get("limit") ?? 30), 100);

    const jobs = await db.job.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        owner: { select: { id: true, name: true, twitterHandle: true, image: true } },
        _count: { select: { applications: true } },
      },
    });

    const hasMore    = jobs.length > limit;
    const page       = hasMore ? jobs.slice(0, limit) : jobs;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    const data = page.map((j) => ({
      id: j.id, title: j.title, company: j.company,
      budget: j.budget, category: j.category, level: j.level,
      jobType: j.jobType, chain: j.chain, status: j.status,
      createdAt: j.createdAt,
      owner: j.owner,
      applicationCount: j._count.applications,
    }));

    return ok({ data, meta: { nextCursor } });
  } catch (e) {
    console.error("[mobile/admin/jobs GET]", e);
    return err("Something went wrong.", 500);
  }
}

const VALID_ACTIONS = new Set(["close", "reopen", "delete"]);

async function patchHandler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, action } = body as { id?: string; action?: string };

    if (!id) return err("id is required.");
    if (!action || !VALID_ACTIONS.has(action)) {
      return err(`action must be one of: ${[...VALID_ACTIONS].join(", ")}.`);
    }

    const job = await db.job.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!job) return err("Job not found.", 404);

    if (action === "delete") {
      await db.job.delete({ where: { id } });
      logAdminAction({ actorId: user.sub, action: "job.delete", targetId: id });
      return ok({ deleted: true });
    }

    const newStatus = action === "close" ? "closed" : "open";
    const updated = await db.job.update({
      where: { id },
      data: { status: newStatus },
      select: { id: true, status: true },
    });

    logAdminAction({ actorId: user.sub, action: action === "close" ? "job.close" : "job.reopen", targetId: id });

    return ok(updated);
  } catch (e) {
    console.error("[mobile/admin/jobs PATCH]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET   = withAdminAuth(getHandler);
export const PATCH = withAdminAuth(patchHandler);
