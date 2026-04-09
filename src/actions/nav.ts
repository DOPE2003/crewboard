"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

export async function getNavDropdownData() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return null;

  const [user, completedOrders, inProgressOrders, reviews] = await Promise.all([
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

  // Profile completion
  const fields = [user.name, user.image, user.bio, user.role, user.walletAddress, user.twitterHandle];
  const filled = fields.filter(Boolean).length + (user.skills?.length > 0 ? 1 : 0);
  const profileCompletion = Math.round((filled / 7) * 100);

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
  };
}
