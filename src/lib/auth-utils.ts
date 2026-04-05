import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }
  return session.user;
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.userId;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
