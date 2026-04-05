import { auth } from "@/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  if (!userId) redirect("/");

  // Always check DB directly — JWT role may be stale after admin grants
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") redirect("/");

  return session!.user;
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
