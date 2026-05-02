"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

export async function getNavDropdownData() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return null;

  const [user, completedOrders, inProgressOrders, reviews, gigCount, postedJobsCount, appliedJobsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        isOG: true,
        createdAt: true,
        profileComplete: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        skills: true,
        availability: true,
        twitterHandle: true,
        bannerImage: true,
        cvUrl: true,
        twitterId: true,
      },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: "in_progress" },
      select: { amount: true },
    }),
    db.review.findMany({
      where: { revieweeId: userId },
      select: { rating: true },
    }),
    db.gig.count({ where: { userId } }),
    db.job.count({ where: { ownerId: userId } }),
    db.jobApplication.count({ where: { applicantId: userId } }),
  ]);

  if (!user) return null;

  const ordersCompleted = completedOrders.length;
  const totalEarned = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const pendingEarnings = inProgressOrders.reduce((sum, o) => sum + o.amount, 0);
  const activeOrderCount = inProgressOrders.length;
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
      : null;

  // Profile completion — same 4-item logic as the dashboard onboarding checklist
  const hasAvatar = !!user.twitterId || !!user.image;
  const hasCv = !!user.cvUrl;
  const hasWallet = !!user.walletAddress;
  const hasGig = gigCount > 0;
  const doneCount = [hasAvatar, hasCv, hasWallet, hasGig].filter(Boolean).length;
  const profileCompletion = Math.round((doneCount / 4) * 100);

  return {
    walletAddress: user.walletAddress,
    isOG: user.isOG,
    role: user.role,
    twitterHandle: user.twitterHandle,
    createdAt: user.createdAt.toISOString(),
    profileComplete: user.profileComplete,
    profileCompletion,
    ordersCompleted,
    totalEarned,
    pendingEarnings,
    activeOrderCount,
    avgRating,
    reviewCount,
    postedJobsCount,
    appliedJobsCount,
  };
}
