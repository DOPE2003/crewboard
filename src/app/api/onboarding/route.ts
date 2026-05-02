import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { containsSocial, SOCIAL_ERROR } from "@/lib/filterSocials";

export async function POST(req: NextRequest) {
  const session = await auth();
  const handle = (session?.user as any)?.twitterHandle as string | undefined;
  const userId = (session?.user as any)?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, userTitle: rawUserTitle, skills, bio, availability } = await req.json();
  // Accept either `userTitle` (new) or `role` (legacy field name from the form)
  const userTitle = rawUserTitle ?? role;

  if (!userTitle) {
    return NextResponse.json({ error: "Role is required." }, { status: 400 });
  }
  if (bio && bio.length > 200) {
    return NextResponse.json({ error: "Bio must be 200 characters or less." }, { status: 400 });
  }

  // Block social handles, emails, URLs in bio
  if (bio && containsSocial(bio)) {
    return NextResponse.json({ error: SOCIAL_ERROR }, { status: 400 });
  }

  // Block social content in custom skills
  if (Array.isArray(skills) && skills.some((s: string) => containsSocial(s))) {
    return NextResponse.json({ error: "Skills cannot contain social handles, emails, or links." }, { status: 400 });
  }

  await db.user.update({
    where: { id: userId },
    data: {
      userTitle,
      skills: Array.isArray(skills) ? skills : [],
      bio: bio ?? "",
      availability: availability ?? "available",
      profileComplete: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/talent");
  if (handle) revalidatePath(`/u/${handle}`);

  return NextResponse.json({ ok: true });
}
