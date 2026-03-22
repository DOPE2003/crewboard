"use server";

import { auth, signOut } from "@/auth";
import db from "@/lib/db";

export async function deleteAccount() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  // Delete in dependency order inside a transaction
  await db.$transaction([
    // Interactions and posts
    db.showcaseInteraction.deleteMany({ where: { userId } }),
    db.showcasePost.deleteMany({ where: { userId } }),
    // Saved talent (both directions)
    db.savedTalent.deleteMany({ where: { OR: [{ saverId: userId }, { savedUserId: userId }] } }),
    // Notifications
    db.notification.deleteMany({ where: { userId } }),
    // Messages sent
    db.message.deleteMany({ where: { senderId: userId } }),
    // Reviews (given and received)
    db.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } }),
    // Orders (both roles — only delete completed/cancelled, leave active ones orphaned safely)
    db.order.deleteMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
        status: { in: ["completed", "cancelled"] },
      },
    }),
    // Gigs
    db.gig.deleteMany({ where: { userId } }),
    // User record
    db.user.delete({ where: { id: userId } }),
  ]);

  // Sign out after deletion
  await signOut({ redirect: false });
}
