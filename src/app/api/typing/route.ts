import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { conversationId } = await req.json();
    if (!conversationId) return NextResponse.json({ ok: false });
    await pusher.trigger(`conversation-${conversationId}`, "typing", { userId });
  } catch {}

  return NextResponse.json({ ok: true });
}
