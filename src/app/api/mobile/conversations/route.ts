/**
 * GET /api/mobile/conversations
 *
 * Returns the authenticated user's conversation list, sorted by most-recent
 * activity.  Each item includes the other participant's profile, the last
 * message (parsed), and the unread count.
 *
 * Headers  Authorization: Bearer <token>
 * Query    ?cursor=<updatedAt ISO>   (for pagination, optional)
 * 200      { data: ConversationItem[] }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { parseMessageBody } from "../_lib/parse-message";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  const cursor = req.nextUrl.searchParams.get("cursor");

  try {
    const conversations = await db.conversation.findMany({
      where: {
        participants: { has: user.sub },
        ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: {
        id: true,
        participants: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, senderId: true, body: true, createdAt: true },
        },
      },
    });

    if (conversations.length === 0) return ok([]);

    // Batch-fetch other participants
    const otherIds = conversations.map(
      (c) => c.participants.find((p) => p !== user.sub) ?? ""
    ).filter(Boolean);

    const [otherUsers, unreadCounts] = await Promise.all([
      db.user.findMany({
        where: { id: { in: otherIds } },
        select: {
          id: true, name: true, twitterHandle: true, image: true,
          lastSeenAt: true, userTitle: true,
        },
      }),
      Promise.all(
        conversations.map((c) =>
          db.message.count({
            where: { conversationId: c.id, read: false, senderId: { not: user.sub } },
          })
        )
      ),
    ]);

    const userMap = Object.fromEntries(otherUsers.map((u) => [u.id, u]));

    const items = conversations.map((c, i) => {
      const otherId = c.participants.find((p) => p !== user.sub) ?? "";
      const other   = userMap[otherId] ?? null;
      const lastMsg = c.messages[0] ?? null;

      return {
        id: c.id,
        updatedAt: c.updatedAt.toISOString(),
        unread: unreadCounts[i],
        other: other
          ? {
              id: other.id,
              handle: other.twitterHandle,
              name: other.name,
              image: other.image,
              title: other.userTitle,
              online: other.lastSeenAt
                ? Date.now() - new Date(other.lastSeenAt).getTime() < 3 * 60 * 1000
                : false,
            }
          : null,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              senderId: lastMsg.senderId,
              sentByMe: lastMsg.senderId === user.sub,
              content: parseMessageBody(lastMsg.body),
              sentAt: lastMsg.createdAt,
            }
          : null,
      };
    });

    const nextCursor =
      conversations.length === 30
        ? conversations[conversations.length - 1].updatedAt.toISOString()
        : null;

    return ok(items, { nextCursor });
  } catch (e) {
    console.error("[mobile/conversations]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET = withMobileAuth(handler);
