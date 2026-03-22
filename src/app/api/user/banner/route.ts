import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 });

  const updated = await db.user.update({
    where: { id: userId },
    data: { bannerImage: url },
    select: { twitterHandle: true },
  });

  revalidatePath("/dashboard");
  if (updated.twitterHandle) revalidatePath(`/u/${updated.twitterHandle}`);
  return NextResponse.json({ ok: true });
}
