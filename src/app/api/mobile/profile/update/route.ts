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
 *   githubHandle, telegramHandle, instagramHandle, discordHandle, linkedinHandle,
 *   website, website2, website3, twitterHandle2, availability,
 *   skills (string[]), email, bannerImage, portfolioItems (Json[])
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
  "instagramHandle", "discordHandle", "linkedinHandle", "website", "website2", "website3",
  "email", "bannerImage", "skills", "walletAddress", "portfolioItems",
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

      // portfolioItems: null means "clear to empty array"
      if (key === "portfolioItems" && val === null) {
        updates[key] = [];
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

    // Normalise instagramHandle — strip leading @, trim whitespace
    if (typeof updates.instagramHandle === "string") {
      let ig = (updates.instagramHandle as string).trim();
      if (ig.startsWith("@")) ig = ig.slice(1);
      updates.instagramHandle = ig || null;
    }

    // Validate email format if being set
    if (typeof updates.email === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        return err("Invalid email address.");
      }
      updates.email = (updates.email as string).toLowerCase();
    }

    // Validate Solana wallet address format (base58, 32–44 chars)
    if (typeof updates.walletAddress === "string") {
      const w = (updates.walletAddress as string).trim();
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w)) {
        return err("Invalid Solana wallet address.");
      }
      updates.walletAddress = w;
    }

    // Drop base64 data URIs — image must be a remote URL (upload via /mobile/messages/upload first).
    // Skip silently so other fields in the same request (name, bio, etc.) still save.
    if (typeof updates.image === "string" && (updates.image as string).startsWith("data:")) {
      delete updates.image;
    }
    if (typeof updates.bannerImage === "string" && (updates.bannerImage as string).startsWith("data:")) {
      delete updates.bannerImage;
    }

    // Validate skills is an array of strings
    if (updates.skills !== undefined && updates.skills !== null) {
      if (!Array.isArray(updates.skills) || (updates.skills as unknown[]).some((s) => typeof s !== "string")) {
        return err("skills must be an array of strings.");
      }
    }

    // Validate portfolioItems
    if (updates.portfolioItems !== undefined && updates.portfolioItems !== null) {
      if (!Array.isArray(updates.portfolioItems)) {
        return err("portfolioItems must be an array.");
      }
      const arr = updates.portfolioItems as unknown[];
      if (arr.length > 50) {
        return err("portfolioItems is limited to 50 entries.");
      }
      for (const item of arr) {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
          return err("portfolioItems entries must be objects.");
        }
      }
    }

    const updated = await db.user.update({
      where: { id: user.sub },
      data: updates,
      select: {
        id: true, twitterHandle: true, name: true, email: true, image: true,
        bio: true, userTitle: true, skills: true, availability: true,
        walletAddress: true, profileComplete: true, isOG: true,
        githubHandle: true, telegramHandle: true, instagramHandle: true,
        linkedinHandle: true, discordHandle: true,
        website: true, website2: true, website3: true,
        twitterHandle2: true, bannerImage: true, role: true,
        portfolioItems: true,
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
