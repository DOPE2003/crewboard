/**
 * POST /api/mobile/messages/upload
 *
 * Upload a single file attachment for use in a chat message.
 * After uploading, send a message with body = __FILE__:{"url":"...","name":"...","size":N,"type":"..."}
 *
 * Headers  Authorization: Bearer <token>
 *          Content-Type: multipart/form-data
 * Body     form field "file" — the file to upload (max 10 MB)
 * 200      { data: { url, name, size, type } }
 */
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { err } from "../../_lib/response";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";

async function handler(req: NextRequest, _user: MobileTokenPayload) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return err("File uploads not configured.", 503);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("Could not parse form data.", 400);
  }

  const file = form.get("file") as File | null;
  if (!file)          return err("No file sent.", 400);
  if (file.size === 0) return err("File is empty.", 400);
  if (file.size > MAX_SIZE) return err("File too large (max 10 MB).", 413);

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    const blob = await put(filename, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Absolute proxy URL — no session auth required on /api/blob/serve, safe for iOS
    const url = `${BASE_URL}/api/blob/serve?url=${encodeURIComponent(blob.url)}`;
    // Return flat shape (not wrapped in {data:}) — matches the spec iOS was built against
    return Response.json({ url, name: file.name, size: file.size, type: file.type });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[mobile/messages/upload]", message);
    return err(`Upload failed: ${message}`, 500);
  }
}

export const POST = withMobileAuth(handler);
