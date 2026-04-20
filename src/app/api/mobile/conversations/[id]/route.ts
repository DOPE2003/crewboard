/**
 * DELETE /api/mobile/conversations/:id
 *
 * Removes the authenticated user from the conversation's participants list.
 * If no participants remain after removal, the conversation (and its messages)
 * are deleted entirely.
 *
 * Headers  Authorization: Bearer <token>
 * 200      { data: { deleted: true } }
 * 403      { error: "Not a participant." }
 * 404      { error: "Conversation not found." }
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const { id: conversationId } = await params;

  try {
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, participants: true },
    });

    if (!conv) return err("Conversation not found.", 404);
    if (!conv.participants.includes(user.sub)) return err("Not a participant.", 403);

    const remaining = conv.participants.filter((p) => p !== user.sub);

    if (remaining.length === 0) {
      // Last participant — delete everything
      await db.message.deleteMany({ where: { conversationId } });
      await db.conversation.delete({ where: { id: conversationId } });
    } else {
      // Remove just this user from participants
      await db.conversation.update({
        where: { id: conversationId },
        data: { participants: remaining },
      });
    }

    return ok({ deleted: true });
  } catch (e) {
    console.error("[mobile/conversations DELETE]", e);
    return err("Something went wrong.", 500);
  }
}
