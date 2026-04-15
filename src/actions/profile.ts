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

  const data: Record<string, string> = {};
  if (twitterHandle2 !== undefined) data.twitterHandle2 = twitterHandle2.replace(/^@/, "").trim();
  if (telegramHandle !== undefined) data.telegramHandle = telegramHandle.replace(/^@/, "").trim();
  if (website !== undefined) data.website = website.trim();
  if (website2 !== undefined) data.website2 = website2.trim();
  if (website3 !== undefined) data.website3 = website3.trim();
  if (githubHandle !== undefined) data.githubHandle = githubHandle.replace(/^@/, "").trim();
  if (discordHandle !== undefined) data.discordHandle = discordHandle.replace(/^@/, "").trim();
  if (linkedinHandle !== undefined) data.linkedinHandle = linkedinHandle.replace(/^@/, "").trim();

  await db.user.update({ where: { id: userId }, data });
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
