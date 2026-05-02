import { getDownloadUrl } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  try {
    const downloadUrl = await getDownloadUrl(url);

    // Forward range header so video seeking works
    const range = req.headers.get("range");
    const upstreamHeaders: HeadersInit = {};
    if (range) upstreamHeaders["Range"] = range;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      upstreamHeaders["Authorization"] = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }

    const upstream = await fetch(downloadUrl, { headers: upstreamHeaders });

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");

    const resHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
    };
    if (contentLength) resHeaders["Content-Length"] = contentLength;
    if (contentRange) resHeaders["Content-Range"] = contentRange;

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error("[blob/serve]", err);
    return new NextResponse("File not found", { status: 404 });
  }
}
