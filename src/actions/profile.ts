"use server";

import { auth } from "@/auth";
import db from "@/lib/db";

export async function updateSocialLinks({
  telegramHandle,
  website,
}: {
  telegramHandle?: string;
  website?: string;
}) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");

  const data: Record<string, string> = {};
  if (telegramHandle !== undefined) data.telegramHandle = telegramHandle.replace(/^@/, "").trim();
  if (website !== undefined) data.website = website.trim();

  await db.user.update({ where: { id: userId }, data });
}

export async function removeBannerImage() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) throw new Error("Not authenticated");
  await db.user.update({ where: { id: userId }, data: { bannerImage: null } });
}
