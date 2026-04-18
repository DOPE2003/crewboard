import db from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";

/**
 * Creates a DB notification AND fires an email to the user (if they have one).
 * Email is fire-and-forget — never blocks the main flow.
 *
 * Pass `messageId` to guarantee at-most-one notification per message:
 * the DB unique constraint on (userId, messageId) silently drops duplicates.
 */
export async function notifyUser({
  userId,
  type,
  title,
  body,
  link,
  actionUrl,
  senderImage,
  messageId,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  actionUrl?: string;
  senderImage?: string | null;
  messageId?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId, type, title, body,
        ...(link        ? { link }        : {}),
        ...(actionUrl   ? { actionUrl }   : {}),
        ...(senderImage ? { senderImage } : {}),
        ...(messageId   ? { messageId }   : {}),
      },
    });
  } catch (e: any) {
    // P2002 = unique constraint violation — duplicate notification, silently skip
    if (e?.code === "P2002") return;
    throw e;
  }

  // Fire email if user has one — non-blocking
  db.user.findUnique({ where: { id: userId }, select: { email: true } })
    .then((user) => {
      if (user?.email) {
        sendNotificationEmail({
          to: user.email,
          subject: `${title} — Crewboard`,
          title,
          body,
          link: link ? `${BASE_URL}${link}` : undefined,
          linkLabel: "View on Crewboard",
        }).catch(() => {});
      }
    })
    .catch(() => {});
}
