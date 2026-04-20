/**
 * GET  /api/mobile/offers          — list sent + received offers
 * POST /api/mobile/offers          — send a new offer inside a conversation
 *
 * GET query params:
 *   ?type=sent|received|all  (default: all)
 *   ?status=pending|accepted|declined|all  (default: all)
 *
 * POST body:
 *   { conversationId, receiverId, title, description, amount, deliveryDays }
 *
 * On POST, a special `__OFFER__:{json}` message is written to the conversation
 * (identical to what the web app does) so both platforms see it in the thread.
 * Pusher is triggered so the receiver gets it instantly.
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser, withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { rateLimit } from "../_lib/rate-limit";

const OFFER_PREFIX = "__OFFER__:";

// ─── GET ──────────────────────────────────────────────────────────────────────

async function getHandler(req: NextRequest) {
  const user = await getMobileUser(req);
  if (!user) return err("Unauthorized", 401);

  const type   = req.nextUrl.searchParams.get("type")   ?? "all";
  const status = req.nextUrl.searchParams.get("status") ?? "all";

  const statusFilter = status === "all" ? undefined : status;

  try {
    const [sent, received] = await Promise.all([
      type !== "received"
        ? db.offer.findMany({
            where: { senderId: user.sub, ...(statusFilter ? { status: statusFilter } : {}) },
            orderBy: { createdAt: "desc" },
            include: {
              receiver: { select: { id: true, name: true, twitterHandle: true, image: true } },
              order:    { select: { id: true, status: true, escrowAddress: true } },
            },
          })
        : [],
      type !== "sent"
        ? db.offer.findMany({
            where: { receiverId: user.sub, ...(statusFilter ? { status: statusFilter } : {}) },
            orderBy: { createdAt: "desc" },
            include: {
              sender: { select: { id: true, name: true, twitterHandle: true, image: true } },
              order:  { select: { id: true, status: true, escrowAddress: true } },
            },
          })
        : [],
    ]);

    return ok({ sent, received });
  } catch (e) {
    console.error("[mobile/offers GET]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function postHandler(req: NextRequest, user: MobileTokenPayload) {
  // 10 offers per hour per user
  if (!rateLimit(`offers:${user.sub}`, 10, 60 * 60 * 1000)) {
    return err("Too many offers sent. Please wait before sending another.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { conversationId, receiverId, title, description, amount, deliveryDays } = body as {
      conversationId?: string;
      receiverId?: string;
      title?: string;
      description?: string;
      amount?: number;
      deliveryDays?: number;
    };

    if (!conversationId) return err("conversationId is required.");
    if (!receiverId)     return err("receiverId is required.");
    if (!title?.trim())  return err("title is required.");
    if (!description?.trim()) return err("description is required.");
    if (!amount || amount < 1) return err("amount must be at least $1.");
    if (!deliveryDays || deliveryDays < 1) return err("deliveryDays must be at least 1.");
    if (receiverId === user.sub) return err("Cannot send an offer to yourself.");

    // Verify participant
    const conv = await db.conversation.findUnique({
      where: { id: conversationId },
      select: { participants: true },
    });
    if (!conv || !conv.participants.includes(user.sub)) {
      return err("Conversation not found.", 404);
    }
    if (!conv.participants.includes(receiverId)) {
      return err("Receiver is not in this conversation.");
    }

    const offer = await db.offer.create({
      data: {
        conversationId,
        senderId: user.sub,
        receiverId,
        title: title.trim(),
        description: description.trim(),
        amount,
        deliveryDays,
      },
    });

    // Special message in conversation thread (mirrors web behaviour)
    const offerPayload = {
      offerId: offer.id,
      title: offer.title,
      description: offer.description,
      amount: offer.amount,
      deliveryDays: offer.deliveryDays,
      senderId: offer.senderId,
      status: "pending",
    };

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: user.sub,
        body: OFFER_PREFIX + JSON.stringify(offerPayload),
      },
      select: { id: true, senderId: true, body: true, createdAt: true, read: true },
    });

    db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }).catch(() => {});

    // Notify receiver
    const sender = await db.user.findUnique({
      where: { id: user.sub },
      select: { name: true, twitterHandle: true },
    });
    const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";

    notifyUser({
      userId: receiverId,
      type: "offer",
      title: "New Offer Received",
      body: `${senderName} sent you an offer: "${offer.title}" for $${offer.amount}`,
      link: `/messages/${conversationId}`,
      actionUrl: `crewboard://offer/${offer.id}`,
    }).catch(() => {});

    sendPush({
      userId: receiverId,
      title: `New offer from ${senderName}`,
      body: `${offer.title} · $${offer.amount}`,
      data: { type: "offer", refId: offer.id },
    }).catch(() => {});

    // Pusher
    try {
      const Pusher = (await import("pusher")).default;
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        useTLS: true,
      });
      await pusher.trigger(`conversation-${conversationId}`, "new-message", {
        ...message, replyTo: null,
      });
    } catch { /* non-fatal */ }

    return ok({ offerId: offer.id, messageId: message.id });
  } catch (e) {
    console.error("[mobile/offers POST]", e);
    return err("Something went wrong.", 500);
  }
}

export { getHandler as GET };
export const POST = withMobileAuth(postHandler);
