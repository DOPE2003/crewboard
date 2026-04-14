import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function logUpload(label: string, data: Record<string, unknown>) {
  console.log(`[upload] ${label}`, JSON.stringify(data, null, 2));
}

// ─── Route ────────────────────────────────────────────────────────────────────

// NOTE: App Router does NOT use `export const config = { api: { bodyParser: false } }`.
// That config is Pages Router only. App Router reads formData via req.formData() natively.

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "unknown";

  // Log incoming request metadata for debugging
  logUpload("request", {
    type,
    contentType: req.headers.get("content-type"),
    contentLength: req.headers.get("content-length"),
    userAgent: req.headers.get("user-agent")?.slice(0, 80),
  });

  // ── Guard: token ─────────────────────────────────────────────────────────

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    logUpload("error", {
      code: "NO_TOKEN",
      message: "BLOB_READ_WRITE_TOKEN is not set in environment variables",
    });
    return NextResponse.json(
      {
        error: "Image uploads are not configured. BLOB_READ_WRITE_TOKEN is missing.",
        code: "NO_TOKEN",
      },
      { status: 503 }
    );
  }

  // ── Parse form data ───────────────────────────────────────────────────────

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logUpload("error", { code: "PARSE_ERROR", message });
    return NextResponse.json(
      { error: `Could not parse form data: ${message}`, code: "PARSE_ERROR" },
      { status: 400 }
    );
  }

  const file = form.get("file") as File | null;

  if (!file) {
    logUpload("error", {
      code: "NO_FILE",
      formKeys: [...form.keys()],
    });
    return NextResponse.json(
      { error: "No file was sent. Ensure the FormData key is 'file'.", code: "NO_FILE" },
      { status: 400 }
    );
  }

  // Log file details for every upload attempt
  logUpload("file", {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeFormatted: fmt(file.size),
    uploadType: type,
  });

  // ── Validate MIME type ────────────────────────────────────────────────────

  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    logUpload("error", {
      code: "INVALID_TYPE",
      receivedType: file.type,
      allowedTypes: ALLOWED_TYPES,
    });
    return NextResponse.json(
      {
        error: `File type '${file.type}' is not allowed. Accepted: ${ALLOWED_TYPES.join(", ")}.`,
        code: "INVALID_TYPE",
      },
      { status: 415 }
    );
  }

  // ── Validate size ─────────────────────────────────────────────────────────

  if (file.size > MAX_SIZE_BYTES) {
    logUpload("error", {
      code: "FILE_TOO_LARGE",
      size: file.size,
      sizeFormatted: fmt(file.size),
      maxFormatted: fmt(MAX_SIZE_BYTES),
    });
    return NextResponse.json(
      {
        error: `File is ${fmt(file.size)}. Maximum allowed size is ${fmt(MAX_SIZE_BYTES)}.`,
        code: "FILE_TOO_LARGE",
      },
      { status: 413 }
    );
  }

  if (file.size === 0) {
    logUpload("error", { code: "EMPTY_FILE" });
    return NextResponse.json(
      { error: "File is empty (0 bytes).", code: "EMPTY_FILE" },
      { status: 400 }
    );
  }

  // ── Build storage path ────────────────────────────────────────────────────

  const mimeToExt: Record<AllowedType, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = mimeToExt[file.type as AllowedType] ?? "jpg";
  const folder = type === "banner" ? "banners" : "avatars";
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // ── Upload to Vercel Blob ─────────────────────────────────────────────────

  try {
    logUpload("uploading", { filename, folder, size: fmt(file.size) });

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    logUpload("success", { url: blob.url, size: fmt(file.size) });
    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    logUpload("error", {
      code: "BLOB_ERROR",
      message,
      stack,
      filename,
    });

    // Detect common Vercel Blob errors and return actionable messages
    let userMessage = `Upload to storage failed: ${message}`;

    if (message.includes("unauthorized") || message.includes("401")) {
      userMessage =
        "BLOB_READ_WRITE_TOKEN is invalid or expired. Regenerate it in the Vercel dashboard under Storage → Blob.";
    } else if (message.includes("not found") || message.includes("404")) {
      userMessage =
        "Vercel Blob store not found. Make sure the Blob store is linked to this project in the Vercel dashboard.";
    } else if (message.includes("payload") || message.includes("size") || message.includes("limit")) {
      userMessage = `File is too large for the storage backend: ${fmt(file.size)}.`;
    }

    return NextResponse.json(
      { error: userMessage, code: "BLOB_ERROR", detail: message },
      { status: 500 }
    );
  }
}
