"use server";

import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import nacl from "tweetnacl";
import bs58 from "bs58";

export async function linkWallet(data: {
  publicKey: string;
  message: string;
  signature: string;
}) {
  const session = await auth();
  const userId = session?.user?.userId;

  if (!userId) {
    throw new Error("You must be logged in to link a wallet.");
  }

  const { publicKey, message, signature } = data;

  try {
    const signatureUint8 = bs58.decode(signature);
    const messageUint8 = new TextEncoder().encode(message);
    const pubKeyUint8 = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, pubKeyUint8);

    if (!isValid) {
      throw new Error("Invalid signature. Ownership could not be verified.");
    }
  } catch (error) {
    throw new Error("Signature verification failed.");
  }

  // Prevent Duplicate Wallets
  const existing = await db.user.findUnique({
    where: { walletAddress: publicKey },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    throw new Error("This wallet is already linked to another account.");
  }

  // Update User
  await db.user.update({
    where: { id: userId },
    data: { walletAddress: publicKey },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/u/${session.user.twitterHandle}`);

  return { ok: true, address: publicKey };
}
