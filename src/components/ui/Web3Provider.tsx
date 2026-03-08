"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia, base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode } from "react";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, sepolia, base, baseSepolia],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,

    // Required App Info
    appName: "Crewboard",

    // Optional App Info
    appDescription: "Where Web3 builders find their crew.",
    appUrl: "https://crewboard.xyz", // your app's url
    appIcon: "https://crewboard.xyz/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
