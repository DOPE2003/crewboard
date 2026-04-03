import { put, createMultipartUpload, uploadPart, completeMultipartUpload } from "@vercel/blob";
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

function checkAuth(session: any) {
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function checkToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File uploads not configured. Add BLOB_READ_WRITE_TOKEN in Vercel." },
      { status: 503 }
    );
  }
  return null;
}

// ── Init multipart upload ────────────────────────────────────────────────────
async function handleInit(req: NextRequest) {
  const session = await auth();
  const authErr = checkAuth(session); if (authErr) return authErr;
  const tokenErr = checkToken(); if (tokenErr) return tokenErr;

  const { searchParams } = new URL(req.url);
  const originalName = searchParams.get("filename") ?? "upload";
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "File type not supported." }, { status: 400 });
  }

  const ext = originalName.split(".").pop() ?? "bin";
  const filename = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const mpu = await createMultipartUpload(filename, {
    access: "private",
    contentType,
  });

  return NextResponse.json({
    uploadId: mpu.uploadId,
    key: mpu.key,
    filename,
    mediaType: getMediaType(contentType),
    fileName: originalName,
  });
}

// ── Upload one part ──────────────────────────────────────────────────────────
async function handlePart(req: NextRequest) {
  const session = await auth();
  const authErr = checkAuth(session); if (authErr) return authErr;
  const tokenErr = checkToken(); if (tokenErr) return tokenErr;

  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get("uploadId") ?? "";
  const key = searchParams.get("key") ?? "";
  const partNumber = parseInt(searchParams.get("partNumber") ?? "1");

  if (!uploadId || !key) {
    return NextResponse.json({ error: "Missing uploadId or key." }, { status: 400 });
  }
  if (!req.body) {
    return NextResponse.json({ error: "No body." }, { status: 400 });
  }

  const part = await uploadPart(key, req.body, {
    access: "private",
    uploadId,
    key,
    partNumber,
  });

  return NextResponse.json({ etag: part.etag, partNumber: part.partNumber });
}

// ── Complete multipart upload ────────────────────────────────────────────────
async function handleComplete(req: NextRequest) {
  const session = await auth();
  const authErr = checkAuth(session); if (authErr) return authErr;
  const tokenErr = checkToken(); if (tokenErr) return tokenErr;

  const { uploadId, key, parts, filename, mediaType, fileName } = await req.json();

  if (!uploadId || !key || !parts?.length) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const blob = await completeMultipartUpload(key, parts, {
    access: "private",
    uploadId,
    key,
  });

  console.log("[portfolio/upload] multipart complete:", blob.url);
  return NextResponse.json({ url: blob.url, mediaType, fileName, fileSize: 0 });
}

// ── Simple single-request upload (for small files) ──────────────────────────
async function handleDirect(req: NextRequest) {
  const session = await auth();
  const authErr = checkAuth(session); if (authErr) return authErr;
  const tokenErr = checkToken(); if (tokenErr) return tokenErr;

  const { searchParams } = new URL(req.url);
  const originalName = searchParams.get("filename") ?? "upload";
  const contentType = req.headers.get("content-type") ?? "application/octet-stream";
  const fileSize = parseInt(req.headers.get("content-length") ?? "0");

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "File type not supported." }, { status: 400 });
  }
  if (!req.body) {
    return NextResponse.json({ error: "No file body." }, { status: 400 });
  }

  const ext = originalName.split(".").pop() ?? "bin";
  const filename = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, req.body, {
    access: "private",
    contentType,
    multipart: true,
  });

  console.log("[portfolio/upload] direct upload success:", blob.url);
  return NextResponse.json({
    url: blob.url,
    mediaType: getMediaType(contentType),
    fileName: originalName,
    fileSize,
  });
}

export async function POST(req: NextRequest) {
  const action = new URL(req.url).searchParams.get("action");
  try {
    if (action === "init") return await handleInit(req);
    if (action === "part") return await handlePart(req);
    if (action === "complete") return await handleComplete(req);
    return await handleDirect(req);
  } catch (err: any) {
    console.error(`[portfolio/upload] action=${action ?? "direct"} failed:`, err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed.", details: String(err) },
      { status: 500 }
    );
  }
}
