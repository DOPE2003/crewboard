import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";

// The one builder — only this handle has owner-level authority.
// Cannot be changed via the UI, only here in code.
export const OWNER_HANDLE = "saad190914";

export type StaffRole = "owner" | "admin" | "moderator";

export async function getStaffRole(): Promise<StaffRole | null> {
  const session = await auth();
  const handle = (session?.user as any)?.twitterHandle as string | undefined;
  const userId = (session?.user as any)?.userId as string | undefined;

  // Owner check uses JWT handle directly (same source as isOwner())
  if (handle?.toLowerCase() === OWNER_HANDLE.toLowerCase()) return "owner";

  if (!userId) return null;
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!dbUser) return null;
  if (dbUser.role === "ADMIN") return "admin";
  if (dbUser.role === "MODERATOR") return "moderator";
  return null;
}

// Allows owner, admin, moderator
export async function requireModerator() {
  const role = await getStaffRole();
  if (!role) redirect("/");
  return role;
}

// Allows owner + admin only
export async function requireAdmin() {
  const role = await getStaffRole();
  if (!role || role === "moderator") redirect("/");
  return role;
}

export async function requireOwner() {
  const session = await auth();
  const handle = (session?.user as any)?.twitterHandle as string | undefined;
  if (!handle || handle.toLowerCase() !== OWNER_HANDLE.toLowerCase()) {
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
