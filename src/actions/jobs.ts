"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJob(formData: FormData) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/login");

  const title       = (formData.get("title") as string ?? "").trim();
  const company     = (formData.get("company") as string ?? "").trim();
  const budget      = (formData.get("budget") as string ?? "").trim();
  const duration    = (formData.get("duration") as string ?? "").trim() || null;
  const chain       = (formData.get("chain") as string) || "ETH";
  const category    = (formData.get("category") as string) || "Development";
  const level       = (formData.get("level") as string) || "Senior";
  const jobType     = (formData.get("jobType") as string) || "Remote";
  const tagsRaw     = (formData.get("tags") as string ?? "").trim();
  const description = (formData.get("description") as string ?? "").trim();
  const milestones  = formData.get("milestones") === "true";

  if (!title || !company || !budget || !description) {
    throw new Error("Title, company, budget and description are required.");
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  await db.job.create({
    data: { title, company, budget, duration, chain, category, level, jobType, tags, description, milestones, ownerId: userId },
  });

  revalidatePath("/jobs");
  redirect("/jobs");
}

export async function deleteJob(id: string) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { ok: false };
  await db.job.deleteMany({ where: { id, ownerId: userId } });
  revalidatePath("/jobs");
  return { ok: true };
}
