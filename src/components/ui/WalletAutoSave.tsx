"use client";

/**
 * Mounted globally in the root layout (inside SolanaProvider + AuthProvider).
 * Silently saves the connected Phantom wallet to the DB the first time a
 * logged-in user connects — so the wallet is on record regardless of which
 * page they visit when they first connect.
 *
 * Uses localStorage to avoid redundant DB calls once the wallet is saved.
 * Renders nothing visible.
 */

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession } from "next-auth/react";
import { linkWallet } from "@/actions/wallet";

export default function WalletAutoSave() {
  const { connected, publicKey } = useWallet();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const save = (pk: string) => {
      const cacheKey = `wallet_saved_${pk}`;
      if (localStorage.getItem(cacheKey)) return; // already saved this session
      linkWallet({ publicKey: pk })
        .then(() => localStorage.setItem(cacheKey, "1"))
        .catch((err) => console.warn("[WalletAutoSave] non-fatal:", err));
    };

    // Wallet adapter
    if (connected && publicKey) {
      save(publicKey.toBase58());
      return;
    }

    // Fallback: Phantom injected provider
    const provider =
      (window as any).phantom?.solana ??
      ((window as any).solana?.isPhantom ? (window as any).solana : null);

    if (provider?.isConnected && provider?.publicKey) {
      save(provider.publicKey.toBase58());
      return;
    }

    const onConnect = () => {
      const pk = provider?.publicKey?.toBase58();
      if (pk) save(pk);
    };
    provider?.on?.("connect", onConnect);
    return () => provider?.off?.("connect", onConnect);
  }, [connected, publicKey, status]);

  return null;
}
