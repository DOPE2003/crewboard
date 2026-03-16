import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.userId as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = `data:application/pdf;base64,${buffer.toString("base64")}`;

    const updated = await db.user.update({ where: { id: userId }, data: { cvUrl: url }, select: { twitterHandle: true } });
    revalidatePath("/dashboard");
    if (updated.twitterHandle) revalidatePath(`/u/${updated.twitterHandle}`);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Upload failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.userId as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const updated = await db.user.update({ where: { id: userId }, data: { cvUrl: null }, select: { twitterHandle: true } });
    revalidatePath("/dashboard");
    if (updated.twitterHandle) revalidatePath(`/u/${updated.twitterHandle}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
