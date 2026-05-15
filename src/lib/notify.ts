import db from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email";
import { pusher } from "@/lib/pusher";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";

/**
 * Creates a DB notification AND fires an email to the user (if they have one).
 * Email is fire-and-forget — never blocks the main flow.
 *
 * Pass `messageId` to guarantee at-most-one notification per message:
 * the DB unique constraint on (userId, messageId) silently drops duplicates.
 *
 * Pass `senderId` to prevent self-notifications (notification skipped when
 * userId === senderId).
 */
export async function notifyUser({
  userId,
  senderId,
  type,
  title,
  body,
  link,
  actionUrl,
  senderImage,
  messageId,
}: {
  userId: string;
  senderId?: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  actionUrl?: string;
  senderImage?: string | null;
  messageId?: string;
}): Promise<string | null> {
  // Never notify a user about their own actions
  if (senderId && userId === senderId) return null;

  let notifId: string | null = null;

  try {
    const notif = await db.notification.create({
      data: {
        userId, type, title, body,
        ...(link        ? { link }        : {}),
        ...(actionUrl   ? { actionUrl }   : {}),
        ...(senderImage ? { senderImage } : {}),
        ...(messageId   ? { messageId }   : {}),
      },
      select: { id: true },
    });
    notifId = notif.id;

    // Fire Pusher real-time event — non-blocking, best-effort
    pusher.trigger(`private-user-${userId}`, "notification", {
      id:        notif.id,
      type,
      title,
      body,
      actionUrl: actionUrl ?? null,
      createdAt: new Date().toISOString(),
      read:      false,
    }).catch(() => {});
  } catch (e: any) {
    // P2002 = unique constraint violation — duplicate notification, silently skip
    if (e?.code === "P2002") return null;
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

  return notifId;
}
