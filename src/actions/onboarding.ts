"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { containsSocial, SOCIAL_ERROR } from "@/lib/filterSocials";

export async function completeOnboarding(data: {
  role: string;
  skills: string[];
  bio: string;
  availability: string;
}) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { role, skills, bio, availability } = data;

  if (!role) throw new Error("Role is required.");
  if (!bio || !bio.trim()) throw new Error("Bio is required.");
  if (bio.length > 200) throw new Error("Bio must be 200 characters or less.");
  if (containsSocial(bio)) throw new Error(SOCIAL_ERROR);
  if (Array.isArray(skills) && skills.some((s: string) => containsSocial(s))) {
    throw new Error("Skills cannot contain social handles, emails, or links.");
  }

  await db.user.update({
    where: { id: userId },
    data: {
      userTitle: role,           // professional role (e.g. "AI Engineer")
      skills: Array.isArray(skills) ? skills : [],
      bio: bio ?? "",
      availability: availability ?? "available",
      profileComplete: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/talent");
  
  return { ok: true };
}
