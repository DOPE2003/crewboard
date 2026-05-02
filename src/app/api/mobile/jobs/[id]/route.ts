/**
 * GET    /api/mobile/jobs/:id  — single job (for deep-link + edit prefill)
 * PATCH  /api/mobile/jobs/:id  — edit job (owner only)
 * DELETE /api/mobile/jobs/:id  — soft-delete job (owner only, sets status=cancelled)
 *
 * Headers  Authorization: Bearer <token>  (required for PATCH/DELETE)
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser, withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { rateLimit } from "../../_lib/rate-limit";

const JOB_SELECT = {
  id: true, title: true, company: true, budget: true, duration: true,
  chain: true, category: true, level: true, jobType: true, tags: true,
  description: true, milestones: true, status: true, ownerId: true, createdAt: true,
  owner: { select: { name: true, twitterHandle: true, image: true } },
};

function formatJob(j: any) {
  return {
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
    status: j.status,
    createdAt: j.createdAt.toISOString(),
    owner: {
      id: j.ownerId,
      name: j.owner.name,
      twitterHandle: j.owner.twitterHandle,
      image: j.owner.image,
    },
  };
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const job = await db.job.findUnique({ where: { id }, select: JOB_SELECT });
    if (!job) return err("not_found", 404);
    return ok(formatJob(job));
  } catch (e) {
    console.error("[mobile/jobs/:id GET]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

const EDITABLE_FIELDS = [
  "title", "company", "budget", "duration", "chain", "category",
  "level", "jobType", "tags", "description", "milestones",
] as const;

async function patchHandler(
  req: NextRequest,
  user: MobileTokenPayload,
  params: { id: string }
) {
  if (!rateLimit(`job-edit:${user.sub}`, 10, 60 * 60 * 1000)) {
    return err("Too many edits. Please wait a moment.", 429);
  }

  try {
    const job = await db.job.findUnique({ where: { id: params.id }, select: { ownerId: true, status: true } });
    if (!job) return err("not_found", 404);
    if (job.ownerId !== user.sub) return err("Forbidden.", 403);
    if (job.status !== "open") return err("Cannot edit a job that is no longer open.", 409);

    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    for (const key of EDITABLE_FIELDS) {
      if (!(key in body)) continue;
      const val = (body as Record<string, unknown>)[key];
      if (val === null || val === "") {
        updates[key] = key === "duration" ? null : val;
      } else {
        updates[key] = val;
      }
    }

    if (Object.keys(updates).length === 0) return err("No valid fields provided.");

    // Sanitize strings
    for (const k of ["title", "company", "budget", "duration", "category", "level", "jobType", "chain"] as const) {
      if (typeof updates[k] === "string") updates[k] = (updates[k] as string).trim() || null;
    }
    if (updates.description) updates.description = (updates.description as string).trim();
    if (updates.tags !== undefined) {
      updates.tags = Array.isArray(updates.tags)
        ? (updates.tags as string[]).map(t => t.trim()).filter(Boolean)
        : [];
    }

    const updated = await db.job.update({
      where: { id: params.id },
      data: updates,
      select: JOB_SELECT,
    });

    return ok(formatJob(updated));
  } catch (e) {
    console.error("[mobile/jobs/:id PATCH]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

async function deleteHandler(
  req: NextRequest,
  user: MobileTokenPayload,
  params: { id: string }
) {
  try {
    const job = await db.job.findUnique({ where: { id: params.id }, select: { ownerId: true, status: true } });
    if (!job) return err("not_found", 404);
    if (job.ownerId !== user.sub) return err("Forbidden.", 403);

    // Soft delete — mark as cancelled
    await db.job.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    return ok({ id: params.id, deleted: true });
  } catch (e) {
    console.error("[mobile/jobs/:id DELETE]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── Route exports ────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);
  return patchHandler(req, user, resolvedParams);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);
  return deleteHandler(req, user, resolvedParams);
}
