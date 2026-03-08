"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { verifyMessage } from "viem";
import { revalidatePath } from "next/cache";

export async function linkWallet(data: {
  address: string;
  message: string;
  signature: `0x${string}`;
}) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("You must be logged in to link a wallet.");
  }

  const { address, message, signature } = data;

  // 1. Cryptographic Verification
  const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature,
  });

  if (!isValid) {
    throw new Error("Invalid signature. Ownership could not be verified.");
  }

  // 2. Prevent Duplicate Wallets
  const existing = await db.user.findUnique({
    where: { walletAddress: address.toLowerCase() },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    throw new Error("This wallet is already linked to another account.");
  }

  // 3. Update User
  await db.user.update({
    where: { id: userId },
    data: { walletAddress: address.toLowerCase() },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/u/${session.user.twitterHandle}`);

  return { ok: true, address };
}
