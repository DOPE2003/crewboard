import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime", "video/mov",
];

const MAX_SIZE = 500 * 1024 * 1024;

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

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "File must be an image or video." }, { status: 400 });
    }

    if (fileSize > 0 && fileSize > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 500MB." }, { status: 400 });
    }

    if (!req.body) {
      return NextResponse.json({ error: "No file body." }, { status: 400 });
    }

    const isVideo = contentType.startsWith("video/");
    const ext = originalName.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
    const folder = isVideo ? "showcase/videos" : "showcase/images";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, req.body, {
      access: "public",
      contentType,
      multipart: true,
    });

    console.log("[showcase/upload] success:", blob.url);
    return NextResponse.json({ url: blob.url, mediaType: isVideo ? "video" : "image" });
  } catch (err: any) {
    console.error("[showcase/upload] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed.", details: String(err) },
      { status: 500 }
    );
  }
}
