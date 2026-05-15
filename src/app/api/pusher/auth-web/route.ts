/**
 * POST /api/pusher/auth-web
 *
 * Pusher private-channel authentication for web clients (NextAuth session).
 * Pusher JS sends application/x-www-form-urlencoded with socket_id + channel_name.
 *
 * Authorization rules:
 *   private-user-{userId}  — session user.id must match {userId}
 *   anything else          — 403
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { pusher } from "@/lib/pusher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const text = await req.text();
  const params = new URLSearchParams(text);
  const socket_id    = params.get("socket_id")    ?? undefined;
  const channel_name = params.get("channel_name") ?? undefined;

  if (!socket_id || !channel_name) {
    return Response.json({ error: "socket_id and channel_name are required." }, { status: 400 });
  }

  if (channel_name.startsWith("private-user-")) {
    const channelUserId = channel_name.slice("private-user-".length);
    if (channelUserId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);
    return Response.json(authResponse);
  }

  return Response.json({ error: "Forbidden" }, { status: 403 });
}
