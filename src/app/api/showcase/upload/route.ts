import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Media uploads not configured. Add BLOB_READ_WRITE_TOKEN in Vercel." },
      { status: 503 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file." }, { status: 400 });

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: "File must be an image or video." }, { status: 400 });
    }

    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? "100MB" : "10MB"}.` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const folder = isVideo ? "showcase/videos" : "showcase/images";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blob = await put(filename, file, { access: "private" });

    return NextResponse.json({ url: blob.url, mediaType: isVideo ? "video" : "image" });
  } catch (err: any) {
    console.error("[showcase/upload]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed." }, { status: 500 });
  }
}
