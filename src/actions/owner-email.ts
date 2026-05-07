"use server";

import { getStaffRole } from "@/lib/auth-utils";
import db from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";

export async function searchUsersForEmail(q: string) {
  const role = await getStaffRole();
  if (role !== "owner") throw new Error("Unauthorized");
  if (!q.trim() || q.trim().length < 2) return [];

  return db.user.findMany({
    where: {
      OR: [
        { name:          { contains: q, mode: "insensitive" } },
        { twitterHandle: { contains: q, mode: "insensitive" } },
        { email:         { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, twitterHandle: true, email: true, image: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
}

export async function sendOwnerEmail({
  userIds,
  subject,
  title,
  body,
  link,
  linkLabel,
}: {
  userIds: string[];
  subject: string;
  title: string;
  body: string;
  link?: string;
  linkLabel?: string;
}) {
  const role = await getStaffRole();
  if (role !== "owner") throw new Error("Unauthorized");

  if (!userIds.length)     throw new Error("No recipients selected.");
  if (userIds.length > 200) throw new Error("Cannot send to more than 200 users at once.");
  if (!subject.trim())     throw new Error("Subject is required.");
  if (!title.trim())       throw new Error("Title is required.");
  if (!body.trim())        throw new Error("Message body is required.");

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { email: true },
  });

  const withEmail = users.filter((u) => u.email);
  const noEmail   = users.length - withEmail.length;

  let sent   = 0;
  let failed = 0;

  await Promise.allSettled(
    withEmail.map(async (u) => {
      try {
        await sendNotificationEmail({
          to:        u.email!,
          subject:   subject.trim(),
          title:     title.trim(),
          body:      body.trim(),
          link:      link?.trim()      || undefined,
          linkLabel: linkLabel?.trim() || undefined,
        });
        sent++;
      } catch {
        failed++;
      }
    })
  );

  return { sent, failed, noEmail };
}
