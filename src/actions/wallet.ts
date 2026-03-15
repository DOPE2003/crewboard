"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function linkWallet(data: {
  publicKey: string;
  message?: string;
  signature?: string;
}) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) throw new Error("You must be logged in to link a wallet.");

  const { publicKey } = data;
  if (!publicKey?.trim()) throw new Error("Invalid wallet address.");

  // Prevent duplicate wallets across accounts
  const existing = await db.user.findUnique({
    where: { walletAddress: publicKey },
    select: { id: true },
  });
  if (existing && existing.id !== userId) {
    throw new Error("This wallet is already linked to another account.");
  }

  await db.user.update({
    where: { id: userId },
    data: { walletAddress: publicKey },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/u/${session?.user?.twitterHandle}`);

  return { ok: true, address: publicKey };
}

export async function unlinkWallet() {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("You must be logged in.");
  }

  await db.user.update({
    where: { id: userId },
    data: { walletAddress: null },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/u/${session?.user?.twitterHandle}`);

  return { ok: true };
}
