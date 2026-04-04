import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime", "video/mov",
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File uploads not configured. Add BLOB_READ_WRITE_TOKEN in Vercel." },
      { status: 503 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Auth check only for token generation requests (from the browser).
  // blob.upload-completed is called by Vercel's CDN infrastructure — no user session.
  if (body.type === "blob.generate-client-token") {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: pathname,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[portfolio/upload] completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err: any) {
    console.error("[portfolio/upload] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed.", details: String(err) },
      { status: 400 }
    );
  }
}
