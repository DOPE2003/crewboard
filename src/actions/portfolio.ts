"use server";

import db from "@/lib/db";
import { requireUserId } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  year?: string;
}

export async function savePortfolioItems(items: PortfolioItem[]) {
  const userId = await requireUserId();

  await db.user.update({
    where: { id: userId },
    data: { portfolioItems: items as any },
  });

  revalidatePath(`/u/[handle]`, "page");
}
