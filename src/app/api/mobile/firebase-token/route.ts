/**
 * POST /api/mobile/firebase-token
 *
 * Returns a Firebase Custom Token for the authenticated mobile user.
 * The iOS client calls Auth.auth().signIn(withCustomToken:) with it so that
 * Firebase UID == Prisma user.id everywhere (Firestore, FCM, Crashlytics).
 *
 * 200  { data: { firebaseToken: string } }
 * 401  { error: "Unauthorized" }
 * 500  { error: "Token generation failed" }
 */
import { NextRequest } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { getFirebaseAdminApp } from "@/lib/firebase-admin";

async function handler(req: NextRequest, user: MobileTokenPayload): Promise<Response> {
  try {
    // Ensure Admin SDK is initialized before calling getAuth()
    getFirebaseAdminApp();

    // Firebase UID = Prisma user.id so security rules using request.auth.uid work
    const firebaseToken = await getAuth().createCustomToken(user.sub, {
      handle: user.handle,
      role: user.role,
    });

    return ok({ firebaseToken });
  } catch (e) {
    console.error("[mobile/firebase-token]", e);
    return err("Token generation failed", 500);
  }
}

export const POST = withMobileAuth(handler);
