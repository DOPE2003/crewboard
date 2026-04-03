import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
];

function getMediaType(mimeType: string): "image" | "video" | "pdf" | "document" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType === "application/zip"
  ) return "document";
  return "other";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File uploads not configured. Add BLOB_READ_WRITE_TOKEN in Vercel." },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const originalName = searchParams.get("filename") ?? "upload";
    // Content-Type header is the file's MIME type when sending raw body
    const contentType = req.headers.get("content-type") ?? "application/octet-stream";
    const fileSize = parseInt(req.headers.get("content-length") ?? "0");

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "File type not supported." }, { status: 400 });
    }

    const isVideo = contentType.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (fileSize > 0 && fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? "50MB" : "10MB"}.` },
        { status: 400 }
      );
    }

    if (!req.body) {
      return NextResponse.json({ error: "No file body." }, { status: 400 });
    }

    const mediaType = getMediaType(contentType);
    const ext = originalName.split(".").pop() ?? "bin";
    const filename = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, req.body, {
      access: "private",
      contentType,
      multipart: isVideo,
    });

    return NextResponse.json({
      url: blob.url,
      mediaType,
      fileName: originalName,
      fileSize,
    });
  } catch (err: any) {
    console.error("[portfolio/upload]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed." }, { status: 500 });
  }
}
