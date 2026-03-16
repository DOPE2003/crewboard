"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // Empty array — standard wallet detection (Phantom, Solflare, MetaMask, etc.)
  // handles adapters automatically without duplicates
  const wallets = useMemo(() => [], []);
  const onError = useCallback((error: WalletError) => {
    // Silently ignore user-rejected or failed auto-connect attempts
    if (
      error.message === "Connection rejected" ||
      error.message?.includes("MetaMask") ||
      error.message?.includes("connect")
    ) return;
    console.error("Wallet error:", error);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
