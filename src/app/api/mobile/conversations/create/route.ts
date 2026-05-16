/**
 * POST /api/mobile/conversations/create
 *
 * Find-or-create a 1-on-1 conversation with another user.
 * Accepts the other user's ID or handle.
 *
 * Headers  Authorization: Bearer <token>
 * Body     { otherUserId?: string; otherHandle?: string }
 * 200      { data: { conversationId, isNew } }
 * 400      { error }
 * 404      { error: "User not found." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { otherUserId, otherHandle } = body as {
      otherUserId?: string;
      otherHandle?: string;
    };

    if (!otherUserId && !otherHandle) {
      return err("otherUserId or otherHandle is required.");
    }

    // Resolve other user
    // Strip leading "@" that iOS clients commonly include in handles.
    const normalizedHandle = otherHandle?.replace(/^@/, "").toLowerCase();
    const isEmail = normalizedHandle?.includes("@"); // e.g. user@example.com

    const other = await db.user.findFirst({
      where: otherUserId
        ? { id: otherUserId }
        : isEmail
          ? { email: normalizedHandle }
          : { twitterHandle: normalizedHandle! },
      select: { id: true },
    });

    if (!other) return err("User not found.", 404);
    if (other.id === user.sub) return err("Cannot start a conversation with yourself.");

    // Canonical key: sort participant IDs so ["a","b"] and ["b","a"] map to the same key
    const participantKey = [user.sub, other.id].sort().join(":");

    // Upsert by participantKey — DB-level unique constraint prevents duplicates
    const existing = await db.conversation.findUnique({
      where: { participantKey },
      select: { id: true },
    });

    if (existing) {
      return ok({ conversationId: existing.id, isNew: false });
    }

    // Create new conversation
    const created = await db.conversation.create({
      data: {
        participants: [user.sub, other.id],
        participantKey,
      },
      select: { id: true },
    });

    return ok({ conversationId: created.id, isNew: true });
  } catch (e) {
    console.error("[mobile/conversations/create]", e);
    return err("Something went wrong.", 500);
  }
}

export const POST = withMobileAuth(handler);
