/**
 * mergeAccounts(canonicalId, orphanId)
 *
 * Safely merges an orphan user row into the canonical row:
 *   1. Copies image / bannerImage / twitterId from orphan → canonical
 *      only when the canonical field is null (COALESCE logic).
 *   2. Re-points all FK relations from orphan → canonical.
 *   3. Deletes the orphan row.
 *
 * Call this after any account-merge operation instead of a raw DELETE.
 */
import db from "@/lib/db";

export async function mergeAccounts(canonicalId: string, orphanId: string) {
  if (canonicalId === orphanId) throw new Error("canonical and orphan must differ");

  const [canonical, orphan] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: canonicalId } }),
    db.user.findUniqueOrThrow({ where: { id: orphanId } }),
  ]);

  // Step 1 — copy non-null fields from orphan to canonical where canonical is null
  await db.user.update({
    where: { id: canonicalId },
    data: {
      image:        canonical.image        ?? orphan.image        ?? undefined,
      bannerImage:  canonical.bannerImage  ?? orphan.bannerImage  ?? undefined,
      twitterId:    canonical.twitterId    ?? orphan.twitterId    ?? undefined,
      email:        canonical.email        ?? orphan.email        ?? undefined,
      name:         canonical.name         ?? orphan.name         ?? undefined,
      bio:          canonical.bio          ?? orphan.bio          ?? undefined,
      walletAddress:canonical.walletAddress?? orphan.walletAddress?? undefined,
    },
  });

  // Step 2 — re-point all relations owned by the orphan to the canonical user
  await Promise.all([
    db.message.updateMany({
      where: { senderId: orphanId },
      data:  { senderId: canonicalId },
    }),
    db.notification.updateMany({
      where: { userId: orphanId },
      data:  { userId: canonicalId },
    }),
    db.offer.updateMany({
      where: { senderId: orphanId },
      data:  { senderId: canonicalId },
    }),
    db.offer.updateMany({
      where: { receiverId: orphanId },
      data:  { receiverId: canonicalId },
    }),
    db.order.updateMany({
      where: { buyerId: orphanId },
      data:  { buyerId: canonicalId },
    }),
    db.order.updateMany({
      where: { sellerId: orphanId },
      data:  { sellerId: canonicalId },
    }),
    db.jobApplication.updateMany({
      where: { applicantId: orphanId },
      data:  { applicantId: canonicalId },
    }),
    db.review.updateMany({
      where: { reviewerId: orphanId },
      data:  { reviewerId: canonicalId },
    }),
    db.review.updateMany({
      where: { revieweeId: orphanId },
      data:  { revieweeId: canonicalId },
    }),
    db.savedTalent.deleteMany({
      // avoid duplicates before re-pointing
      where: { saverId: orphanId, savedUserId: canonicalId },
    }),
    db.savedTalent.updateMany({
      where: { saverId: orphanId },
      data:  { saverId: canonicalId },
    }),
    db.showcasePost.updateMany({
      where: { authorId: orphanId },
      data:  { authorId: canonicalId },
    }),
    db.showcaseInteraction.updateMany({
      where: { userId: orphanId },
      data:  { userId: canonicalId },
    }),
  ]);

  // Update conversations that list the orphan as a participant
  const convs = await db.conversation.findMany({
    where: { participants: { has: orphanId } },
    select: { id: true, participants: true },
  });

  for (const conv of convs) {
    const updated = conv.participants.map((p) =>
      p === orphanId ? canonicalId : p
    );
    // Deduplicate in case canonical was already a participant
    const deduped = [...new Set(updated)];
    await db.conversation.update({
      where: { id: conv.id },
      data:  { participants: deduped },
    });
  }

  // Step 3 — delete the orphan
  await db.user.delete({ where: { id: orphanId } });

  return { canonical: canonicalId, orphan: orphanId, conversationsMigrated: convs.length };
}
