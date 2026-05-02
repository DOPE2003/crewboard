/**
 * GET /api/mobile/users/me/applications
 *
 * Returns the current user's job applications (newest first).
 * Powers the "My Applications" screen in the Profile tab.
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  try {
    const applications = await db.jobApplication.findMany({
      where: { applicantId: user.sub },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, status: true, coverLetter: true, proposedRate: true, createdAt: true,
        job: {
          select: { id: true, title: true, company: true, budget: true, status: true },
        },
      },
    });

    return ok(
      applications.map(a => ({
        id: a.id,
        jobId: a.job.id,
        jobTitle: a.job.title,
        company: a.job.company,
        budget: a.job.budget,
        jobStatus: a.job.status,
        status: a.status,
        coverLetter: a.coverLetter,
        proposedRate: a.proposedRate,
        createdAt: a.createdAt,
      }))
    );
  } catch (e) {
    console.error("[mobile/users/me/applications GET]", e);
    return err("Something went wrong.", 500);
  }
}
