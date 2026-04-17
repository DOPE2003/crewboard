import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getFirebaseAdminApp } from "./firebase-admin";

async function getUserTokens(userId: string): Promise<string[]> {
  const app = getFirebaseAdminApp();
  const snapshot = await getFirestore(app)
    .collection("users")
    .doc(userId)
    .collection("fcmTokens")
    .get();

  return snapshot.docs.map((d) => d.data().token as string).filter(Boolean);
}

async function pruneDeadTokens(userId: string, deadTokens: string[]) {
  if (deadTokens.length === 0) return;
  const app = getFirebaseAdminApp();
  const col = getFirestore(app)
    .collection("users")
    .doc(userId)
    .collection("fcmTokens");
  const docs = await col.where("token", "in", deadTokens).get();
  const batch = getFirestore(app).batch();
  docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function sendPush(params: {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  badge?: number;
}): Promise<void> {
  const tokens = await getUserTokens(params.userId);
  if (tokens.length === 0) return;

  const app = getFirebaseAdminApp();
  const response = await getMessaging(app).sendEachForMulticast({
    tokens,
    notification: { title: params.title, body: params.body },
    data: params.data,
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: params.badge ?? 1,
          "content-available": 1,
        },
      },
    },
  });

  const deadTokens: string[] = [];
  response.responses.forEach((r, idx) => {
    if (!r.success) {
      const code = r.error?.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        deadTokens.push(tokens[idx]);
      }
    }
  });

  pruneDeadTokens(params.userId, deadTokens).catch(() => {});
}
