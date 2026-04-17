import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdminApp } from "./firebase-admin";

export async function sendPush(params: {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  badge?: number;
}): Promise<void> {
  const app = getFirebaseAdminApp();
  const db = getFirestore(app);

  const userDoc = await db.collection("users").doc(params.userId).get();
  const token = userDoc.data()?.fcmToken as string | undefined;

  if (!token) {
    console.log(`[push] no FCM token for user ${params.userId}, skipping`);
    return;
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
            badge: params.badge ?? 1,
            "mutable-content": 1,
          },
        },
      },
      android: { priority: "high" },
    });
    console.log(`[push] sent to ${params.userId}`);
  } catch (err: any) {
    if (err.code === "messaging/registration-token-not-registered") {
      db.collection("users").doc(params.userId).update({ fcmToken: null }).catch(() => {});
    }
    console.error(`[push] failed for ${params.userId}:`, err.code, err.message);
  }
}
