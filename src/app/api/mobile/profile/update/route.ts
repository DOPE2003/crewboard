/**
 * POST /api/mobile/profile/update
 *
 * Update the authenticated user's own profile.
 * Rules:
 *   - Field absent / undefined  → ignored (partial update)
 *   - Field = null or ""        → cleared (set to null in DB)
 *   - Field present with value  → updated
 *
 * Updatable fields: name, image, bio, userTitle, twitterHandle (handle rename),
 *   githubHandle, telegramHandle, discordHandle, linkedinHandle,
 *   website, website2, website3, twitterHandle2, availability,
 *   skills (string[]), email, bannerImage
 *
 * Headers  Authorization: Bearer <token>
 * Body     Partial<above fields>
 * 200      { data: { ...updated user } }
 * 400      { error }
 * 401      { error: "Unauthorized" }
 * 409      { error: "That <field> is already taken." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

const ALLOWED_FIELDS = [
  "name", "image", "bio", "userTitle", "availability",
  "twitterHandle", "twitterHandle2", "githubHandle", "telegramHandle",
  "discordHandle", "linkedinHandle", "website", "website2", "website3",
  "email", "bannerImage", "skills",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));

    const updates: Record<string, unknown> = {};

    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue; // not sent → ignore

      const val = (body as Record<string, unknown>)[key];

      // image / bannerImage: null or "" means "unchanged" — require an explicit URL to update,
      // or a dedicated clearImage action (not yet exposed). Prevents accidental wipes when the
      // iOS client sends null for fields it never loaded from the server.
      if ((key === "image" || key === "bannerImage") && (val === null || val === "")) {
        continue;
      }

      if (val === null || val === "") {
        updates[key] = null; // clear text fields intentionally
      } else {
        updates[key] = val; // set
      }
    }

    if (Object.keys(updates).length === 0) {
      return err("No valid fields provided.");
    }

    // Normalise handle to lowercase if being changed
    if (typeof updates.twitterHandle === "string") {
      updates.twitterHandle = updates.twitterHandle.toLowerCase().trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(updates.twitterHandle as string)) {
        return err("Handle must be 3–20 characters (letters, numbers, underscores).");
      }
    }

    // Validate email format if being set
    if (typeof updates.email === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        return err("Invalid email address.");
      }
      updates.email = (updates.email as string).toLowerCase();
    }

    // Reject base64 image blobs — image must be a remote URL
    if (typeof updates.image === "string" && (updates.image as string).startsWith("data:")) {
      return err("image must be a URL, not a base64 data URI.");
    }
    if (typeof updates.bannerImage === "string" && (updates.bannerImage as string).startsWith("data:")) {
      return err("bannerImage must be a URL, not a base64 data URI.");
    }

    // Validate skills is an array of strings
    if (updates.skills !== undefined && updates.skills !== null) {
      if (!Array.isArray(updates.skills) || (updates.skills as unknown[]).some((s) => typeof s !== "string")) {
        return err("skills must be an array of strings.");
      }
    }

    const updated = await db.user.update({
      where: { id: user.sub },
      data: updates,
      select: {
        id: true, twitterHandle: true, name: true, email: true, image: true,
        bio: true, userTitle: true, skills: true, availability: true,
        walletAddress: true, profileComplete: true, isOG: true,
        githubHandle: true, telegramHandle: true, linkedinHandle: true,
        discordHandle: true, website: true, website2: true, website3: true,
        twitterHandle2: true, bannerImage: true, role: true,
      },
    });

    return ok(updated);
  } catch (e: any) {
    console.error("[mobile/profile/update]", e);
    if (e?.code === "P2002") {
      const field = (e.meta?.target as string[] | undefined)?.[0] ?? "field";
      return err(`That ${field} is already taken by another user.`, 409);
    }
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
