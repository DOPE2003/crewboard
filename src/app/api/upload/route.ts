import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Image uploads not configured yet. Add BLOB_READ_WRITE_TOKEN in Vercel." }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image." }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const folder = file.size > 512 * 1024 ? "banners" : "avatars";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blob = await put(filename, file, { access: "private" });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed." }, { status: 500 });
  }
}
