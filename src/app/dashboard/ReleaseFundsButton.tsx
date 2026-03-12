"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { completeOrder } from "@/actions/orders";
import { IDL, CrewboardEscrow } from "@/lib/crewboard_escrow";

const PROGRAM_ID = new PublicKey("8vhcBUX8YVXCiBdaEKQ68YVpfw6VFg24EppGQCBNmzyo");
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export default function ReleaseFundsButton({ 
  orderId, 
  sellerWallet, 
  amount 
}: { 
  orderId: string, 
  sellerWallet: string,
  amount: number
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const handleRelease = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert("Please connect your wallet first.");
      return;
    }

    if (!confirm("Are you sure? This will release the funds to the seller. This cannot be undone.")) return;

    setLoading(true);
    try {
      // 1. Setup Anchor
      const provider = new anchor.AnchorProvider(connection, wallet as any, anchor.AnchorProvider.defaultOptions());
      const program = new anchor.Program<CrewboardEscrow>(IDL, PROGRAM_ID, provider);

      // 2. Derive PDAs (must match initialization seeds)
      const [escrowStatePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          new PublicKey(sellerWallet).toBuffer(),
          Buffer.from(orderId)
        ],
        PROGRAM_ID
      );

      const escrowTokenAccount = await getAssociatedTokenAddress(USDC_MINT, escrowStatePda, true);
      const sellerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(sellerWallet));

      // 3. Call instruction
      const txHash = await program.methods
        .releaseFunds()
        .accounts({
          buyer: wallet.publicKey,
          seller: new PublicKey(sellerWallet),
          escrowState: escrowStatePda,
          escrowTokenAccount: escrowTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Funds Released:", txHash);

      // 4. Update Database
      await completeOrder(orderId, txHash);
      alert("Success! Funds have been paid to the seller.");
      window.location.reload();

    } catch (e: any) {
      console.error("Release Error:", e);
      alert(e.message ?? "Transaction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRelease}
      disabled={loading}
      className="btn-primary"
      style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem", height: "auto", background: "#2DD4BF", color: "#000" }}
    >
      {loading ? "RELEASING..." : "RELEASE FUNDS"}
    </button>
  );
}
