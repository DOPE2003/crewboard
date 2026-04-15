"use client";

/**
 * Mounted globally in the root layout (inside SolanaProvider + AuthProvider).
 * Silently saves the connected wallet to the DB the first time a
 * logged-in user connects — so the wallet is on record regardless of which
 * page they visit when they first connect.
 *
 * Uses the wallet adapter hooks (cross-browser) instead of direct
 * window.phantom.solana access.
 */

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { linkWallet } from "@/actions/wallet";

export default function WalletAutoSave() {
  const { connected, publicKey } = useWallet();
  const { status, data: session } = useSession();
  const userId = (session?.user as any)?.userId as string | undefined;

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    if (!connected || !publicKey) return;

    const pk = publicKey.toBase58();
    const cacheKey = `wallet_saved_${userId}_${pk}`;
    if (localStorage.getItem(cacheKey)) return;

    linkWallet({ publicKey: pk })
      .then(() => localStorage.setItem(cacheKey, "1"))
      .catch((err) => console.warn("[WalletAutoSave] non-fatal:", err));
  }, [connected, publicKey, status, userId]);

  return null;
}
