import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only block real Twitter/X users (not Apple Sign-In, whose IDs are stored in the same column)
  const dbUser = await db.user.findUnique({ where: { id: userId }, select: { twitterId: true } });
  const isRealTwitterUser = dbUser?.twitterId && !dbUser.twitterId.startsWith("apple:");
  if (isRealTwitterUser) {
    return NextResponse.json(
      { error: "Twitter users cannot change their profile photo. Update it on X." },
      { status: 403 },
    );
  }

  let imageUrl: string;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    // File upload path — store in Vercel Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "File uploads not configured." }, { status: 503 });
    }
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) return NextResponse.json({ error: "No file." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5 MB." }, { status: 413 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `avatars/${userId}-${Date.now()}.${ext}`;
    const blob = await put(filename, file, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN });

    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";
    imageUrl = `${BASE_URL}/api/blob/serve?url=${encodeURIComponent(blob.url)}`;
  } else {
    // Legacy JSON path — only accept an already-resolved URL (not base64)
    const body = await req.json();
    if (!body?.url) return NextResponse.json({ error: "No URL." }, { status: 400 });
    if ((body.url as string).startsWith("data:")) {
      return NextResponse.json({ error: "Send as file upload, not base64." }, { status: 400 });
    }
    imageUrl = body.url as string;
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { image: imageUrl },
    select: { twitterHandle: true },
  });
  revalidatePath("/dashboard");
  if (updated.twitterHandle) revalidatePath(`/u/${updated.twitterHandle}`);
  return NextResponse.json({ ok: true, image: imageUrl });
}
