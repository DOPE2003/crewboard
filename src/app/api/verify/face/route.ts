import { NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST() {
  const session = await auth();
  const userId = (session?.user as { userId?: string })?.userId;
  const twitterHandle = (session?.user as { twitterHandle?: string })?.twitterHandle;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { humanVerified: true } });
  if (user?.humanVerified) {
    return NextResponse.json({ ok: true, already: true });
  }

  await db.user.update({
    where: { id: userId },
    data: { humanVerified: true, worldIdLevel: "face" },
  });

  await db.notification.create({
    data: {
      userId,
      type: "face_verified",
      title: "Identity Verified",
      body: "Your face verification is complete. A verified badge now appears on your profile.",
    },
  });

  if (twitterHandle) {
    revalidatePath(`/u/${twitterHandle}`);
    revalidatePath("/talent");
  }

  return NextResponse.json({ ok: true });
}
