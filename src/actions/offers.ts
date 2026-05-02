"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

const OFFER_PREFIX = "__OFFER__:";

export async function createOffer({
  conversationId,
  receiverId,
  title,
  description,
  amount,
  deliveryDays,
}: {
  conversationId: string;
  receiverId: string;
  title: string;
  description: string;
  amount: number;
  deliveryDays: number;
}) {
  const session = await auth();
  const senderId = session?.user?.userId;
  if (!senderId) throw new Error("Unauthorized");
  if (senderId === receiverId) throw new Error("Cannot send offer to yourself");

  if (!title.trim()) throw new Error("Title is required");
  if (!description.trim()) throw new Error("Description is required");
  if (amount < 1) throw new Error("Amount must be at least $1");
  if (deliveryDays < 1) throw new Error("Delivery must be at least 1 day");

  // Verify conversation exists and user is a participant
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { participants: true },
  });
  if (!conv || !conv.participants.includes(senderId)) throw new Error("Conversation not found");
  if (!conv.participants.includes(receiverId)) throw new Error("Receiver not in conversation");

  // Create the offer
  const offer = await db.offer.create({
    data: {
      conversationId,
      senderId,
      receiverId,
      title: title.trim(),
      description: description.trim(),
      amount,
      deliveryDays,
    },
  });

  // Send a special message in the chat with offer data
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
      senderId,
      body: OFFER_PREFIX + JSON.stringify(offerPayload),
    },
    select: { id: true, senderId: true, body: true, createdAt: true, read: true },
  });

  // Update conversation timestamp
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Notify receiver
  const sender = await db.user.findUnique({
    where: { id: senderId },
    select: { name: true, twitterHandle: true },
  });
  const senderName = sender?.name ?? sender?.twitterHandle ?? "Someone";

  await notifyUser({
    userId: receiverId,
    type: "offer",
    title: "New Offer Received",
    body: `${senderName} sent you an offer: "${offer.title}" for $${offer.amount}`,
    link: `/messages/${conversationId}`,
    actionUrl: `crewboard://offer/${offer.id}`,
  });

  // Trigger Pusher for real-time
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
      ...message,
      replyTo: null,
    });
  } catch {}

  revalidatePath(`/messages/${conversationId}`);
  return { offerId: offer.id, messageId: message.id };
}

// Creates (or reuses) a conversation with recipientId, then posts an offer into it.
// Returns the conversationId so the client can navigate there.
export async function sendOfferFromProfile(
  recipientId: string,
  data: { title: string; description: string; amount: number; deliveryDays: number },
): Promise<{ conversationId: string; offerId: string }> {
  const session = await auth();
  const senderId = (session?.user as any)?.userId as string | undefined;
  if (!senderId) throw new Error("Not signed in");
  if (senderId === recipientId) throw new Error("Cannot send an offer to yourself");

  if (!data.title.trim()) throw new Error("Title is required");
  if (!data.description.trim()) throw new Error("Description is required");
  if (data.amount < 1) throw new Error("Amount must be at least $1");
  if (data.deliveryDays < 1) throw new Error("Delivery must be at least 1 day");

  // Reuse existing conversation or create one.
  // Always set participantKey so iOS conversations/create finds the same conversation.
  const participantKey = [senderId, recipientId].sort().join(":");

  const existing = await db.conversation.findFirst({
    where: {
      OR: [
        { participantKey },
        { participants: { hasEvery: [senderId, recipientId] } },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, participantKey: true },
  });

  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
    // Backfill participantKey if missing — ensures iOS can find this conversation
    if (!existing.participantKey) {
      try {
        await db.conversation.update({ where: { id: existing.id }, data: { participantKey } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e;
      }
    }
  } else {
    const conv = await db.conversation.create({
      data: { participants: [senderId, recipientId], participantKey },
      select: { id: true },
    });
    conversationId = conv.id;
  }

  const { offerId } = await createOffer({
    conversationId,
    receiverId: recipientId,
    title: data.title.trim(),
    description: data.description.trim(),
    amount: data.amount,
    deliveryDays: data.deliveryDays,
  });

  return { conversationId, offerId };
}

export async function respondToOffer(
  offerId: string,
  action: "accept" | "decline",
): Promise<
  | { status: "accepted"; orderId: string }
  | { status: "declined" }
  | { error: string }
> {
  try {
    const session = await auth();
    const userId = session?.user?.userId ?? session?.user?.id;
    if (!userId) return { error: "Not signed in — please refresh and try again." };

    const offer = await db.offer.findUnique({
      where: { id: offerId },
      include: {
        sender:   { select: { name: true, twitterHandle: true } },
        receiver: { select: { name: true, twitterHandle: true } },
      },
    });
    if (!offer)                          return { error: "Offer not found." };
    if (offer.receiverId !== userId)     return { error: "Only the receiver can respond." };
    if (offer.status !== "pending")      return { error: `Offer is already ${offer.status}.` };

    if (action === "decline") {
      await db.offer.update({ where: { id: offerId }, data: { status: "declined" } });

      const receiverName = offer.receiver.name ?? offer.receiver.twitterHandle ?? "Someone";
      notifyUser({
        userId: offer.senderId,
        type: "offer",
        title: "Offer Declined",
        body: `${receiverName} declined your offer "${offer.title}". You can send a new one.`,
        link: `/messages/${offer.conversationId}`,
        actionUrl: `crewboard://offer/${offerId}`,
      }).catch(() => {});

      sendPush({
        userId: offer.senderId,
        title: "Offer Declined",
        body: `${receiverName} declined your offer for "${offer.title}"`,
        data: {
          type: "offer_declined",
          actionUrl: `crewboard://offer/${offerId}`,
          offerId,
          freelancerName: receiverName,
          jobTitle: offer.title,
        },
      }).catch(() => {});

      revalidatePath(`/messages/${offer.conversationId}`);
      return { status: "declined" };
    }

    // Accept: create a custom gig + order
    const gig = await db.gig.create({
      data: {
        userId:      offer.receiverId,
        title:       offer.title,
        description: offer.description,
        price:       offer.amount,
        deliveryDays: offer.deliveryDays,
        category:    "Custom Offer",
        tags:        ["custom-offer"],
        status:      "custom",
      },
    });

    const order = await db.order.create({
      data: {
        gigId:    gig.id,
        buyerId:  offer.senderId,
        sellerId: offer.receiverId,
        amount:   offer.amount,
        status:   "pending",
      },
    });

    await db.offer.update({
      where: { id: offerId },
      data: { status: "accepted", orderId: order.id },
    });

    const receiverName = offer.receiver.name ?? offer.receiver.twitterHandle ?? "Someone";
    notifyUser({
      userId: offer.senderId,
      type: "offer",
      title: "Offer Accepted!",
      body: `${receiverName} accepted your offer "${offer.title}" for $${offer.amount}. Fund the escrow to start!`,
      link: `/orders/${order.id}`,
      actionUrl: `crewboard://offer/${offerId}`,
    }).catch(() => {});

    sendPush({
      userId: offer.senderId,
      title: "Offer Accepted",
      body: `${receiverName} accepted your offer for "${offer.title}"`,
      data: {
        type: "offer_accepted",
        actionUrl: `crewboard://offer/${offerId}`,
        offerId,
        orderId: order.id,
        freelancerName: receiverName,
        jobTitle: offer.title,
      },
    }).catch(() => {});

    revalidatePath(`/messages/${offer.conversationId}`);
    revalidatePath("/orders");
    return { status: "accepted", orderId: order.id };
  } catch (e: any) {
    console.error("[respondToOffer]", e);
    return { error: e?.meta?.cause ?? e?.message ?? "Something went wrong. Try again." };
  }
}

export async function withdrawOffer(offerId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) return { ok: false, error: "Unauthorized" };

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { senderId: true, status: true },
  });

  if (!offer || offer.senderId !== userId) return { ok: false, error: "Offer not found." };
  if (offer.status !== "pending") return { ok: false, error: "Only pending offers can be withdrawn." };

  await db.offer.delete({ where: { id: offerId } });
  revalidatePath("/offers");
  return { ok: true };
}

// Get fresh offer status (for real-time updates in the bubble)
export async function getOfferStatus(offerId: string) {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { status: true, orderId: true },
  });
  return offer;
}
