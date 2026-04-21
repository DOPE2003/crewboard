"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSocialLinks({
  twitterHandle2,
  telegramHandle,
  website,
  website2,
  website3,
  githubHandle,
  discordHandle,
  linkedinHandle,
}: {
  twitterHandle2?: string;
  telegramHandle?: string;
  website?: string;
  website2?: string;
  website3?: string;
  githubHandle?: string;
  discordHandle?: string;
  linkedinHandle?: string;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  const data: Record<string, string | null> = {};
  if (twitterHandle2 !== undefined) { const v = twitterHandle2.replace(/^@/, "").trim(); data.twitterHandle2 = v || null; }
  if (telegramHandle !== undefined) { const v = telegramHandle.replace(/^@/, "").trim(); data.telegramHandle = v || null; }
  if (website !== undefined) { const v = website.trim(); data.website = v || null; }
  if (website2 !== undefined) { const v = website2.trim(); data.website2 = v || null; }
  if (website3 !== undefined) { const v = website3.trim(); data.website3 = v || null; }
  if (githubHandle !== undefined) { const v = githubHandle.replace(/^@/, "").trim(); data.githubHandle = v || null; }
  if (discordHandle !== undefined) { const v = discordHandle.replace(/^@/, "").trim(); data.discordHandle = v || null; }
  if (linkedinHandle !== undefined) { const v = linkedinHandle.replace(/^@/, "").trim(); data.linkedinHandle = v || null; }

  const updated = await db.user.update({ where: { id: userId }, data, select: { twitterHandle: true } });
  revalidatePath(`/u/${updated.twitterHandle}`);
}

export async function saveBannerImage(bannerImage: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");
  await db.user.update({ where: { id: userId }, data: { bannerImage } });
  revalidatePath(`/u/${(session?.user as any)?.twitterHandle}`);
  return { success: true };
}

export async function removeBannerImage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");
  await db.user.update({ where: { id: userId }, data: { bannerImage: null } });
  revalidatePath(`/u/${(session?.user as any)?.twitterHandle}`);
  return { success: true };
}

export async function saveBannerHeight(height: number) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");
  
  await db.user.update({
    where: { id: userId },
    data: { bannerHeight: Math.min(Math.max(height, 100), 400) } // Clamp between 100-400
  });

  revalidatePath(`/u/${(session?.user as any)?.twitterHandle}`);
  return { success: true };
}
