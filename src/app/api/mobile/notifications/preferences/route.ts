/**
 * GET /api/mobile/notifications/preferences
 * PUT /api/mobile/notifications/preferences
 *
 * GET: Returns the user's notification preferences (creates defaults if missing).
 * PUT: Partial update — only provided fields are changed.
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

const DEFAULTS = {
  jobAlerts: true,
  jobCategories: [] as string[],
  offerAlerts: true,
  chatAlerts: true,
  marketing: false,
};

async function getOrCreate(userId: string) {
  return db.notificationPreferences.upsert({
    where: { userId },
    create: { userId, ...DEFAULTS },
    update: {},
    select: { jobAlerts: true, jobCategories: true, offerAlerts: true, chatAlerts: true, marketing: true },
  });
}

export async function GET(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  try {
    const prefs = await getOrCreate(user.sub);
    return ok(prefs);
  } catch (e) {
    console.error("[mobile/notifications/preferences GET]", e);
    return err("Something went wrong.", 500);
  }
}

export async function PUT(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  try {
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    if (typeof body.jobAlerts   === "boolean") updates.jobAlerts   = body.jobAlerts;
    if (typeof body.offerAlerts === "boolean") updates.offerAlerts = body.offerAlerts;
    if (typeof body.chatAlerts  === "boolean") updates.chatAlerts  = body.chatAlerts;
    if (typeof body.marketing   === "boolean") updates.marketing   = body.marketing;
    if (Array.isArray(body.jobCategories)) {
      updates.jobCategories = (body.jobCategories as unknown[])
        .filter(c => typeof c === "string")
        .map(c => (c as string).trim())
        .filter(Boolean);
    }

    if (Object.keys(updates).length === 0) return err("No valid fields provided.");

    const prefs = await db.notificationPreferences.upsert({
      where: { userId: user.sub },
      create: { userId: user.sub, ...DEFAULTS, ...updates },
      update: updates,
      select: { jobAlerts: true, jobCategories: true, offerAlerts: true, chatAlerts: true, marketing: true },
    });

    return ok(prefs);
  } catch (e) {
    console.error("[mobile/notifications/preferences PUT]", e);
    return err("Something went wrong.", 500);
  }
}
