"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { notifyUser } from "@/lib/notify";

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

export async function respondToOffer(offerId: string, action: "accept" | "decline") {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) throw new Error("Unauthorized");

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: {
      sender: { select: { name: true, twitterHandle: true } },
      receiver: { select: { name: true, twitterHandle: true } },
    },
  });
  if (!offer) throw new Error("Offer not found");
  if (offer.receiverId !== userId) throw new Error("Only the receiver can respond");
  if (offer.status !== "pending") throw new Error("Offer already responded to");

  if (action === "decline") {
    await db.offer.update({
      where: { id: offerId },
      data: { status: "declined" },
    });

    // Notify sender
    const receiverName = offer.receiver.name ?? offer.receiver.twitterHandle ?? "Someone";
    await notifyUser({
      userId: offer.senderId,
      type: "offer",
      title: "Offer Declined",
      body: `${receiverName} declined your offer "${offer.title}". You can send a new one.`,
      link: `/messages/${offer.conversationId}`,
    });

    revalidatePath(`/messages/${offer.conversationId}`);
    return { status: "declined" as const };
  }

  // Accept: create a custom gig + order
  const gig = await db.gig.create({
    data: {
      userId: offer.receiverId,
      title: offer.title,
      description: offer.description,
      price: offer.amount,
      deliveryDays: offer.deliveryDays,
      category: "Custom Offer",
      tags: ["custom-offer"],
      status: "custom",
    },
  });

  const order = await db.order.create({
    data: {
      gigId: gig.id,
      buyerId: offer.senderId,
      sellerId: offer.receiverId,
      amount: offer.amount,
      status: "pending",
    },
  });

  await db.offer.update({
    where: { id: offerId },
    data: { status: "accepted", orderId: order.id },
  });

  // Notify sender
  const receiverName = offer.receiver.name ?? offer.receiver.twitterHandle ?? "Someone";
  await notifyUser({
    userId: offer.senderId,
    type: "offer",
    title: "Offer Accepted!",
    body: `${receiverName} accepted your offer "${offer.title}" for $${offer.amount}. Fund the escrow to start!`,
    link: `/orders/${order.id}`,
  });

  revalidatePath(`/messages/${offer.conversationId}`);
  revalidatePath("/orders");
  return { status: "accepted" as const, orderId: order.id };
}

// Get fresh offer status (for real-time updates in the bubble)
export async function getOfferStatus(offerId: string) {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { status: true, orderId: true },
  });
  return offer;
}
