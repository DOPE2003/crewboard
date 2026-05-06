import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.userId) redirect("/login");

  const userId = session.user.userId;

  const [
    dbUserRaw,
    recentConvos,
    activeOrders,
    completedOrders,
    completedBuyerOrders,
    profileViewCount,
    unreadMessageCount,
    totalConvoCount,
    postedJobs,
    sentOffers,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { gigs: { where: { status: "active" } } },
    }),
    db.conversation.findMany({
      where: { participants: { has: userId } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true, twitterHandle: true, image: true } } },
        },
      },
    }),
    db.order.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: { in: ["pending", "funded", "delivered"] } },
      select: { id: true, amount: true, status: true, buyerId: true, sellerId: true, gig: { select: { title: true } } },
    }),
    db.order.findMany({
      where: { sellerId: userId, status: "completed" },
      select: { amount: true },
    }),
    db.order.findMany({
      where: { buyerId: userId, status: "completed" },
      select: { amount: true },
    }),
    db.notification.count({ where: { userId, type: "profile_view" } }),
    db.notification.count({ where: { userId, read: false, type: { not: "profile_view" } } }),
    db.conversation.count({ where: { participants: { has: userId } } }),
    db.job.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, status: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.offer.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, title: true, amount: true, status: true, conversationId: true,
        receiver: { select: { name: true, twitterHandle: true, image: true } },
      },
    }),
  ]);

  if (!dbUserRaw) redirect("/login");

  const dbUser = JSON.parse(JSON.stringify(dbUserRaw));

  const otherParticipantIds = recentConvos.flatMap((c) =>
    c.participants.filter((p) => p !== userId)
  );
  const otherParticipants = otherParticipantIds.length
    ? await db.user.findMany({
        where: { id: { in: otherParticipantIds } },
        select: { id: true, name: true, twitterHandle: true, image: true },
      })
    : [];
  const otherByConvo: Record<string, typeof otherParticipants[0] | undefined> = {};
  for (const c of recentConvos) {
    const otherId = c.participants.find((p) => p !== userId);
    otherByConvo[c.id] = otherId ? otherParticipants.find((u) => u.id === otherId) : undefined;
  }

  return (
    <DashboardClient data={{
      userId,
      dbUser,
      recentConvos,
      activeOrders,
      completedOrders,
      completedBuyerOrders,
      profileViewCount,
      unreadMessageCount,
      totalConvoCount,
      postedJobs,
      sentOffers,
      otherByConvo,
    }} />
  );
}
