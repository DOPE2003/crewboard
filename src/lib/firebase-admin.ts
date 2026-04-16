import { initializeApp, getApps, cert, App } from "firebase-admin/app";

let app: App;

function getFirebaseAdminApp(): App {
  if (app) return app;

  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is not set");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  return app;
}

export { getFirebaseAdminApp };
