"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createGig(data: {
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  category: string;
  tags: string[];
}) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { profileComplete: true },
  });

  if (!user?.profileComplete) {
    throw new Error("Complete your profile before creating a gig.");
  }

  const { title, description, price, deliveryDays, category, tags } = data;

  if (!title?.trim()) throw new Error("Title is required.");
  if (!description?.trim()) throw new Error("Description is required.");
  if (!category?.trim()) throw new Error("Category is required.");
  if (price < 1) throw new Error("Price must be at least $1.");
  if (deliveryDays < 1) throw new Error("Delivery days required.");

  const gig = await db.gig.create({
    data: {
      userId,
      title: title.trim(),
      description: description.trim(),
      price,
      deliveryDays,
      category: category.trim(),
      tags: Array.isArray(tags) ? tags : [],
    },
  });

  revalidatePath("/gigs");
  revalidatePath("/dashboard");
  
  return gig;
}

export async function toggleGigStatus(gigId: string, currentStatus: string) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) throw new Error("Unauthorized");

  const gig = await db.gig.findUnique({
    where: { id: gigId },
    select: { userId: true },
  });

  if (!gig || gig.userId !== userId) throw new Error("Unauthorized");

  const nextStatus = currentStatus === "active" ? "paused" : "active";

  await db.gig.update({
    where: { id: gigId },
    data: { status: nextStatus },
  });

  revalidatePath("/gigs");
  revalidatePath(`/gigs/${gigId}`);
  
  return { ok: true };
}

export async function deleteGig(gigId: string) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) throw new Error("Unauthorized");

  const gig = await db.gig.findUnique({
    where: { id: gigId },
    select: { userId: true },
  });

  if (!gig || gig.userId !== userId) throw new Error("Unauthorized");

  await db.gig.delete({ where: { id: gigId } });

  revalidatePath("/gigs");
  revalidatePath("/dashboard");
  
  return { ok: true };
}
