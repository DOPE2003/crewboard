import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";

const TOGGLE_TYPES = ["like", "save"];

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { postId, type, watchPercent } = await req.json();
    if (!postId || !type) {
      return NextResponse.json({ error: "postId and type are required." }, { status: 400 });
    }

    if (TOGGLE_TYPES.includes(type)) {
      const existing = await db.showcaseInteraction.findFirst({
        where: { userId, postId, type },
      });

      if (existing) {
        await db.showcaseInteraction.delete({ where: { id: existing.id } });
        return NextResponse.json({ toggled: false });
      } else {
        await db.showcaseInteraction.create({ data: { userId, postId, type } });
        return NextResponse.json({ toggled: true });
      }
    }

    // Non-toggle: view, profile_click, hire_click, dm, skip
    await db.showcaseInteraction.create({
      data: { userId, postId, type, watchPercent: watchPercent ?? null },
    });

    if (type === "view") {
      await db.showcasePost.update({
        where: { id: postId },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[showcase/interact]", err);
    return NextResponse.json({ error: "Failed to record interaction." }, { status: 500 });
  }
}
