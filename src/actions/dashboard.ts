"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

export async function getDashboardData() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { gigs: { where: { status: "active" }, select: { id: true } } },
  });

  return user;
}

export interface OnboardingStatus {
  needsAvatar: boolean;
  needsCv: boolean;
  needsWallet: boolean;
  needsGig: boolean;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) return null;

  const [user, gigCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { image: true, cvUrl: true, walletAddress: true, twitterId: true },
    }),
    db.gig.count({ where: { userId } }),
  ]);

  if (!user) return null;

  return {
    // Only nudge email-signup users — Twitter users get their avatar auto-set from X
    needsAvatar: !user.twitterId && !user.image,
    needsCv: !user.cvUrl,
    needsWallet: !user.walletAddress,
    needsGig: gigCount === 0,
  };
}
