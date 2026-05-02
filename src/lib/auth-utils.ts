import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";

// Fallback handle-based owner check — covers accounts created before OWNER role existed.
// Once the DB record is updated to role=OWNER this is no longer needed.
export const OWNER_HANDLE = "saad190914";

export type StaffRole = "owner" | "admin" | "support";

export async function getStaffRole(): Promise<StaffRole | null> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  const jwtHandle = (session?.user as any)?.twitterHandle as string | undefined;

  if (!userId && !jwtHandle) return null;

  // OWNER_USER_ID env override — wins regardless of DB role
  const ownerId = process.env.OWNER_USER_ID;
  if (ownerId && userId && userId === ownerId) {
    console.log("[auth] OWNER_USER_ID override: id=%s role=owner", userId);
    return "owner";
  }

  const dbUser = userId
    ? await db.user.findUnique({ where: { id: userId }, select: { role: true, twitterHandle: true } })
    : jwtHandle
    ? await db.user.findUnique({ where: { twitterHandle: jwtHandle }, select: { role: true, twitterHandle: true } })
    : null;

  if (!dbUser) return null;

  console.log("[auth] getStaffRole: id=%s role=%s", userId ?? jwtHandle, dbUser.role);

  if (dbUser.role === "OWNER") return "owner";
  if (dbUser.role === "ADMIN") return "admin";
  if (dbUser.role === "SUPPORT") return "support";

  // Legacy handle fallback — owner handle before OWNER role was added
  if (dbUser.twitterHandle?.toLowerCase() === OWNER_HANDLE.toLowerCase()) return "owner";

  return null;
}

export async function requireStaff() {
  const role = await getStaffRole();
  if (!role) redirect("/");
  return role;
}

export async function requireAdmin(): Promise<string | null> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined ?? null;
  const role = await getStaffRole();
  if (!role || role === "support") redirect("/");
  return userId;
}

export async function requireOwner(): Promise<string | null> {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined ?? null;
  const role = await getStaffRole();
  if (role !== "owner") redirect("/");
  return userId;
}

export async function isOwner(): Promise<boolean> {
  const role = await getStaffRole();
  return role === "owner";
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) redirect("/login");
  return userId;
}
