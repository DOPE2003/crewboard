"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-utils";

export async function submitReview(orderId: string, revieweeId: string, rating: number, body: string) {
  const reviewerId = await requireUserId();

  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, sellerId: true, status: true, gig: { select: { title: true } } },
  });
  if (!order) throw new Error("Order not found");
  if (order.status !== "completed") throw new Error("Can only review completed orders");
  if (order.buyerId !== reviewerId && order.sellerId !== reviewerId) throw new Error("Unauthorized");
  if (revieweeId !== order.buyerId && revieweeId !== order.sellerId) throw new Error("Invalid reviewee");
  if (revieweeId === reviewerId) throw new Error("Cannot review yourself");

  await db.review.create({
    data: { orderId, reviewerId, revieweeId, rating, body: body.trim() || null },
  });

  // Notify reviewee
  const reviewer = await db.user.findUnique({ where: { id: reviewerId }, select: { name: true, twitterHandle: true } });
  const reviewerName = reviewer?.name ?? reviewer?.twitterHandle ?? "Someone";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  await db.notification.create({
    data: {
      userId: revieweeId,
      type: "review",
      title: "New Review",
      body: `${reviewerName} left you a ${stars} review for "${order.gig.title}"`,
      link: `/orders/${orderId}`,
    },
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/u/`);
}
