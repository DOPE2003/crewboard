"use server";

import { auth } from "@/auth";

/**
 * Extracts the authenticated user's DB id from the session.
 * Throws "Unauthorized" if no session or userId is present.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
