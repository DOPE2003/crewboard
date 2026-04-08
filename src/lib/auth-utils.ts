import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";

// The one builder — only this handle has owner-level authority.
// Cannot be changed via the UI, only here in code.
export const OWNER_HANDLE = "saad190914";

export async function requireAdmin() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/");

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, twitterHandle: true },
  });
  // Owner always passes, even without ADMIN role set
  if (dbUser?.twitterHandle === OWNER_HANDLE) return session!.user;
  if (dbUser?.role !== "ADMIN") redirect("/");

  return session!.user;
}

export async function requireOwner() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/");

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { twitterHandle: true },
  });
  if (dbUser?.twitterHandle !== OWNER_HANDLE) {
    throw new Error("Only the platform owner can perform this action.");
  }
  return session!.user;
}

export async function isOwner(): Promise<boolean> {
  const session = await auth();
  const handle = (session?.user as any)?.twitterHandle as string | undefined;
  return handle === OWNER_HANDLE;
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) redirect("/login");
  return userId;
}
