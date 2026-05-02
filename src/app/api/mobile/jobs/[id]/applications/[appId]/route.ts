/**
 * PATCH  /api/mobile/jobs/:id/applications/:appId  — accept / reject (owner)
 * DELETE /api/mobile/jobs/:id/applications/:appId  — withdraw (applicant)
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../../_lib/auth";
import { ok, err } from "../../../../_lib/response";
import { sendPush } from "@/lib/push";
import { notifyUser } from "@/lib/notify";

type RouteParams = { params: Promise<{ id: string; appId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const { id: jobId, appId } = await params;

  try {
    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { ownerId: true, title: true, company: true },
    });
    if (!job) return err("not_found", 404);
    if (job.ownerId !== user.sub) return err("Forbidden.", 403);

    const app = await db.jobApplication.findUnique({
      where: { id: appId },
      select: { id: true, status: true, applicantId: true, jobId: true },
    });
    if (!app || app.jobId !== jobId) return err("not_found", 404);
    if (app.status !== "pending") return err("Application is no longer pending.", 409);

    const body = await req.json().catch(() => ({}));
    const newStatus = body?.status as string | undefined;
    if (newStatus !== "accepted" && newStatus !== "rejected") {
      return err("status must be 'accepted' or 'rejected'.");
    }

    if (newStatus === "accepted") {
      // Accept this one, reject all other pending apps, mark job in_progress
      await db.$transaction([
        db.jobApplication.update({
          where: { id: appId },
          data: { status: "accepted" },
        }),
        db.jobApplication.updateMany({
          where: { jobId, status: "pending", id: { not: appId } },
          data: { status: "rejected" },
        }),
        db.job.update({
          where: { id: jobId },
          data: { status: "in_progress", acceptedApplicantId: appId },
        }),
      ]);

      // Notify accepted applicant with push
      await Promise.allSettled([
        notifyUser({
          userId: app.applicantId,
          type: "offer_accepted",
          title: "Your application was accepted!",
          body: `${job.title} at ${job.company}`,
          link: `/jobs/${jobId}`,
          actionUrl: `crewboard://job/${jobId}`,
        }).catch(() => {}),
        sendPush({
          userId: app.applicantId,
          title: "Your application was accepted!",
          body: `${job.title} at ${job.company}`,
          data: { type: "application_accepted", jobId, actionUrl: `crewboard://job/${jobId}` },
        }).catch(() => {}),
      ]);

      // Notify rejected applicants (in-app only, no push)
      const rejected = await db.jobApplication.findMany({
        where: { jobId, status: "rejected", id: { not: appId } },
        select: { applicantId: true },
      });
      for (const r of rejected) {
        notifyUser({
          userId: r.applicantId,
          type: "offer_declined",
          title: "Application not selected",
          body: `The position for "${job.title}" has been filled.`,
          link: `/jobs`,
        }).catch(() => {});
      }
    } else {
      await db.jobApplication.update({
        where: { id: appId },
        data: { status: "rejected" },
      });

      // In-app only for rejection
      notifyUser({
        userId: app.applicantId,
        type: "offer_declined",
        title: "Application not selected",
        body: `Your application for "${job.title}" was not selected.`,
        link: `/jobs`,
      }).catch(() => {});
    }

    return ok({ id: appId, status: newStatus });
  } catch (e) {
    console.error("[mobile/jobs/:id/applications/:appId PATCH]", e);
    return err("Something went wrong.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const { id: jobId, appId } = await params;

  try {
    const app = await db.jobApplication.findUnique({
      where: { id: appId },
      select: { applicantId: true, jobId: true, status: true },
    });
    if (!app || app.jobId !== jobId) return err("not_found", 404);
    if (app.applicantId !== user.sub) return err("Forbidden.", 403);
    if (app.status === "accepted") return err("Cannot withdraw an accepted application.", 409);

    await db.jobApplication.update({
      where: { id: appId },
      data: { status: "withdrawn" },
    });

    // Notify job owner (in-app only)
    const job = await db.job.findUnique({
      where: { id: jobId },
      select: { ownerId: true, title: true },
    });
    if (job) {
      const applicant = await db.user.findUnique({
        where: { id: user.sub },
        select: { name: true, twitterHandle: true },
      });
      const name = applicant?.name ?? applicant?.twitterHandle ?? "An applicant";
      notifyUser({
        userId: job.ownerId,
        type: "system",
        title: "Application withdrawn",
        body: `${name} withdrew their application for "${job.title}".`,
        link: `/jobs/${jobId}`,
      }).catch(() => {});
    }

    return ok({ id: appId, status: "withdrawn" });
  } catch (e) {
    console.error("[mobile/jobs/:id/applications/:appId DELETE]", e);
    return err("Something went wrong.", 500);
  }
}
