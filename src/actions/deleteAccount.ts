"use server";

import { auth, signOut } from "@/auth";
import db from "@/lib/db";

/** Hard-delete all data for a user. Safe to call from web or mobile. */
export async function deleteAccountById(userId: string): Promise<void> {
  await db.$transaction([
    db.showcaseInteraction.deleteMany({ where: { userId } }),
    db.showcasePost.deleteMany({ where: { userId } }),
    db.savedTalent.deleteMany({ where: { OR: [{ saverId: userId }, { savedUserId: userId }] } }),
    db.notification.deleteMany({ where: { userId } }),
    db.message.deleteMany({ where: { senderId: userId } }),
    db.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } }),
    db.order.deleteMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { in: ["completed", "cancelled"] },
      },
    }),
    db.gig.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);
}

export async function deleteAccount() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  await deleteAccountById(userId);
  await signOut({ redirect: false });
}
