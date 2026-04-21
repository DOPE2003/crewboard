/**
 * POST /api/mobile/profile/avatar-upload
 *
 * Upload a profile photo and save it as the user's avatar in one step.
 * iOS should call this instead of sending base64 in /profile/update.
 *
 * Headers  Authorization: Bearer <token>
 *          Content-Type: multipart/form-data
 * Body     form field "file" — image file (max 5 MB)
 * 200      { data: { image: "<absolute url>" } }
 */
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";

async function handler(req: NextRequest, user: MobileTokenPayload) {
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
  if (!file)           return err("No file sent.", 400);
  if (file.size === 0) return err("File is empty.", 400);
  if (file.size > MAX_SIZE) return err("File too large (max 5 MB).", 413);

  if (!file.type.startsWith("image/")) {
    return err("File must be an image.", 400);
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `avatars/${user.sub}-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const image = `${BASE_URL}/api/blob/serve?url=${encodeURIComponent(blob.url)}`;

    await db.user.update({
      where: { id: user.sub },
      data: { image },
    });

    return ok({ image });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[mobile/profile/avatar-upload]", message);
    return err(`Upload failed: ${message}`, 500);
  }
}

export const POST = withMobileAuth(handler);
