import db from "@/lib/db";
import { getFirebaseAdminApp } from "./firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export async function fanOutNewJobNotifications(job: {
  id: string;
  title: string;
  company: string;
  budget: string;
  category: string;
  ownerId: string;
}) {
  const app = getFirebaseAdminApp();
  const firestore = getFirestore(app);
  const messaging = getMessaging(app);

  const title = "New Web3 Job";
  const body = `${job.title} · ${job.budget}`;
  const actionUrl = `crewboard://job/${job.id}`;

  // Find all opted-in users with matching category filter (excluding the poster)
  const recipients = await db.user.findMany({
    where: {
      id: { not: job.ownerId },
      notificationPreferences: {
        jobAlerts: true,
        OR: [
          { jobCategories: { isEmpty: true } },
          { jobCategories: { has: job.category } },
        ],
      },
    },
    select: { id: true },
  });

  if (!recipients.length) return;

  // Fetch FCM tokens from Firestore in batches
  const tokens: string[] = [];
  const recipientIds: string[] = recipients.map(r => r.id);

  // Firestore `in` operator supports up to 30 items per query
  for (let i = 0; i < recipientIds.length; i += 30) {
    const batch = recipientIds.slice(i, i + 30);
    const snap = await firestore.collection("users")
      .where("__name__", "in", batch)
      .get();
    for (const doc of snap.docs) {
      const token = doc.data()?.fcmToken as string | undefined;
      if (token) tokens.push(token);
    }
  }

  if (!tokens.length) return;

  // FCM multicast in batches of 500
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    try {
      await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title, body },
        data: { type: "new_job", jobId: job.id, actionUrl },
        apns: { payload: { aps: { sound: "default", "mutable-content": 1 } } },
        android: { priority: "high" },
      });
    } catch (e) {
      console.error("[job-notify] FCM batch failed:", e);
    }
  }

  // In-app notification for each recipient
  try {
    await db.notification.createMany({
      data: recipientIds.map(userId => ({
        userId,
        type: "new_job",
        title,
        body,
        actionUrl,
        link: `/jobs/${job.id}`,
      })),
      skipDuplicates: true,
    });
  } catch (e) {
    console.error("[job-notify] createMany notifications failed:", e);
  }

  console.log(`[job-notify] fanned out to ${recipientIds.length} recipients (${tokens.length} FCM tokens) for job ${job.id}`);
}
