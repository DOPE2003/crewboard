import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

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
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file." }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported." }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isVideo ? "50MB" : "10MB"}.` },
        { status: 400 }
      );
    }

    const mediaType = getMediaType(file.type);
    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, file, {
      access: "private",
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      mediaType,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (err: any) {
    console.error("[portfolio/upload]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed." }, { status: 500 });
  }
}
