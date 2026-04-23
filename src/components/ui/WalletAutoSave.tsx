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

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { linkWallet } from "@/actions/wallet";

export default function WalletAutoSave() {
  const { connected, publicKey } = useWallet();
  const { status, data: session } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.userId as string | undefined;
  // Track which pk we already attempted in *this* tab session — survives
  // re-renders but resets on full reload (so a failed save can retry).
  const attemptedPk = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    if (!connected || !publicKey) {
      // Reset on disconnect so reconnecting a different wallet retries.
      attemptedPk.current = null;
      return;
    }

    const pk = publicKey.toBase58();
    if (attemptedPk.current === pk) return;
    attemptedPk.current = pk;

    console.log("[WalletAutoSave] linking", pk, "to user", userId);
    linkWallet({ publicKey: pk })
      .then((res) => {
        console.log("[WalletAutoSave] linked OK", res);
        // Force server components (dashboard, profile, etc.) to re-fetch so
        // the new walletAddress appears immediately without a manual refresh.
        router.refresh();
      })
      .catch((err) => {
        console.error("[WalletAutoSave] FAILED to link wallet:", err);
        // Allow retry on next render
        attemptedPk.current = null;
        // Surface the error so the user knows the connection didn't persist
        if (typeof window !== "undefined") {
          alert(
            "Wallet connected in browser, but failed to save to your account:\n\n" +
              (err?.message ?? String(err)) +
              "\n\nTry disconnecting and reconnecting.",
          );
        }
      });
  }, [connected, publicKey, status, userId, router]);

  return null;
}
