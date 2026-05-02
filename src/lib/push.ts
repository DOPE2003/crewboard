import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdminApp } from "./firebase-admin";
import db from "@/lib/db";

export async function sendPush(params: {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  badge?: number;
}): Promise<void> {
  const app = getFirebaseAdminApp();
  const firestore = getFirestore(app);

  const userDoc = await firestore.collection("users").doc(params.userId).get();
  const token = userDoc.data()?.fcmToken as string | undefined;

  if (!token) {
    console.log(`[push] no FCM token for user ${params.userId}, skipping`);
    return;
  }

  // Use provided badge or query the real unread notification count
  let badge = params.badge;
  if (badge === undefined) {
    badge = await db.notification.count({
      where: { userId: params.userId, read: false },
    }).catch(() => 1);
  }

  try {
    await getMessaging(app).send({
      token,
      notification: { title: params.title, body: params.body },
      data: params.data,
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge,
            "mutable-content": 1,
          },
        },
      },
      android: { priority: "high" },
    });
    console.log(`[push] sent to ${params.userId} (badge: ${badge})`);
  } catch (err: any) {
    if (err.code === "messaging/registration-token-not-registered") {
      firestore.collection("users").doc(params.userId).update({ fcmToken: null }).catch(() => {});
    }
    console.error(`[push] failed for ${params.userId}:`, err.code, err.message);
  }
}
