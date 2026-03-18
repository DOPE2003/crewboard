"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // Explicit adapters — avoids standard wallet detection which probes window.ethereum
  // and causes MetaMask to throw "Failed to connect to MetaMask"
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
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
