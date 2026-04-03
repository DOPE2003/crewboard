import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const { searchParams } = new URL(req.url);
    const originalName = searchParams.get("filename") ?? "upload";
    const contentType = req.headers.get("content-type") ?? "application/octet-stream";
    const fileSize = parseInt(req.headers.get("content-length") ?? "0");

    const isVideo = contentType.startsWith("video/");
    const isImage = contentType.startsWith("image/");
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: "File must be an image or video." }, { status: 400 });
    }

    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileSize > 0 && fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? "100MB" : "10MB"}.` },
        { status: 400 }
      );
    }

    if (!req.body) {
      return NextResponse.json({ error: "No file body." }, { status: 400 });
    }

    const ext = originalName.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const folder = isVideo ? "showcase/videos" : "showcase/images";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, req.body, {
      access: "private",
      contentType,
      multipart: isVideo,
    });

    return NextResponse.json({ url: blob.url, mediaType: isVideo ? "video" : "image" });
  } catch (err: any) {
    console.error("[showcase/upload]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed." }, { status: 500 });
  }
}
