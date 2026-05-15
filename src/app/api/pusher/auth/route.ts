/**
 * POST /api/pusher/auth
 *
 * Pusher private-channel authentication. iOS sends socket_id + channel_name,
 * we verify the caller has access to that channel and return a Pusher signature.
 *
 * Authorization rules:
 *   private-conversation-{conversationId} — caller must be a participant
 *   private-user-{userId}                 — caller's id must match {userId}
 *   anything else                         — 403
 *
 * Headers  Authorization: Bearer <mobile JWT>
 * Body     { socket_id: string; channel_name: string }
 * 200      { auth: "<key>:<hmac>" }
 * 403      { error: "Forbidden" }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { getMobileUser } from "@/app/api/mobile/_lib/auth";
import { err } from "@/app/api/mobile/_lib/response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const body = await req.json().catch(() => ({}));
  const { socket_id, channel_name } = body as { socket_id?: string; channel_name?: string };

  if (!socket_id || !channel_name) {
    return err("socket_id and channel_name are required.");
  }

  // Authorise private-conversation-{conversationId}
  if (channel_name.startsWith("private-conversation-")) {
    const conversationId = channel_name.slice("private-conversation-".length);
    if (!conversationId) return err("Invalid channel name.", 403);

    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });
    if (!conv || !conv.participants.includes(user.sub)) {
      return err("Forbidden", 403);
    }

    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    return Response.json(authResponse);
  }

  // Authorise private-user-{userId}
  if (channel_name.startsWith("private-user-")) {
    const channelUserId = channel_name.slice("private-user-".length);
    if (channelUserId !== user.sub) return err("Forbidden", 403);

    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    return Response.json(authResponse);
  }

  return err("Forbidden", 403);
}
