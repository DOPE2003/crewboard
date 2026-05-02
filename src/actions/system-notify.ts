"use server";

import { getStaffRole } from "@/lib/auth-utils";
import db from "@/lib/db";
import { notifyUser } from "@/lib/notify";

type Target = "all" | "incomplete" | "complete" | "no-gigs";

export async function sendSystemNotification({
  title,
  body,
  link,
  target,
}: {
  title: string;
  body: string;
  link?: string;
  target: Target;
}) {
  const role = await getStaffRole();
  if (role !== "owner") throw new Error("Unauthorized");

  if (!title.trim() || !body.trim()) throw new Error("Title and body are required");

  // Build where clause based on target
  const where: any = {};
  if (target === "incomplete") where.profileComplete = false;
  if (target === "complete") where.profileComplete = true;
  if (target === "no-gigs") where.gigs = { none: {} };

  const users = await db.user.findMany({
    where,
    select: { id: true },
  });

  // Batch create notifications
  await db.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "system",
      title: title.trim(),
      body: body.trim(),
      link: link?.trim() || null,
    })),
  });

  // Fire emails in background (non-blocking)
  for (const u of users) {
    notifyUser({
      userId: u.id,
      type: "system",
      title: title.trim(),
      body: body.trim(),
      link: link?.trim() || undefined,
    }).catch(() => {});
  }

  return { sent: users.length };
}
