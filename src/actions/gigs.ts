"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

function validateImageUrl(image?: string | null) {
  if (!image) return;
  if (image.startsWith("/api/blob/serve")) return;
  try {
    const u = new URL(image);
    if (!u.hostname.endsWith("crewboard.fun"))
      throw new Error("Image must be uploaded to the Crewboard CDN.");
  } catch {
    throw new Error("Image must be uploaded to the Crewboard CDN.");
  }
}

export async function createGig(data: {
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  category: string;
  tags: string[];
  image?: string | null;
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
    throw new Error("Complete your profile before creating a service.");
  }

  const { title, description, price, deliveryDays, category, tags, image } = data;

  if (!title?.trim()) throw new Error("Title is required.");
  if (!description?.trim()) throw new Error("Description is required.");
  if (!category?.trim()) throw new Error("Category is required.");
  if (price < 1) throw new Error("Price must be at least $1.");
  if (deliveryDays < 1) throw new Error("Delivery days required.");
  validateImageUrl(image);

  const gig = await db.gig.create({
    data: {
      userId,
      title: title.trim(),
      description: description.trim(),
      price,
      deliveryDays,
      category: category.trim(),
      tags: Array.isArray(tags) ? tags : [],
      ...(image ? { image } : {}),
    },
  });

  revalidatePath("/gigs");
  revalidatePath("/dashboard");

  return gig;
}

export async function updateGig(gigId: string, data: {
  title: string;
  description: string;
  price: number;
  deliveryDays: number;
  category: string;
  tags: string[];
  image?: string | null;
}) {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) throw new Error("Unauthorized");

  const gig = await db.gig.findUnique({ where: { id: gigId }, select: { userId: true } });
  if (!gig || gig.userId !== userId) throw new Error("Unauthorized");

  const { title, description, price, deliveryDays, category, tags, image } = data;
  if (!title?.trim()) throw new Error("Title is required.");
  if (!description?.trim()) throw new Error("Description is required.");
  if (!category?.trim()) throw new Error("Category is required.");
  if (price < 1) throw new Error("Price must be at least $1.");
  if (deliveryDays < 1) throw new Error("Delivery days required.");
  validateImageUrl(image);

  const updated = await db.gig.update({
    where: { id: gigId },
    data: {
      title: title.trim(),
      description: description.trim(),
      price,
      deliveryDays,
      category: category.trim(),
      tags: Array.isArray(tags) ? tags : [],
      image: image ?? null,
    },
  });

  revalidatePath("/gigs");
  revalidatePath(`/gigs/${gigId}`);
  revalidatePath("/gigs/mine");

  return updated;
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
