import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500mb",
    },
    responseLimit: "500mb",
  },
};

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime", "video/mov",
];

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Media uploads not configured. Add BLOB_READ_WRITE_TOKEN in Vercel." },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth();
        if (!session?.user) throw new Error("Unauthorized");

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: pathname,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("[showcase/upload] completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err: any) {
    console.error("[showcase/upload] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed.", details: String(err) },
      { status: 400 }
    );
  }
}
