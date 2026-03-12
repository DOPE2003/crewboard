"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { updateOrderFunding } from "@/actions/orders";
import { IDL, CrewboardEscrow } from "@/lib/crewboard_escrow";

// The Program ID from our lib.rs
const PROGRAM_ID = new PublicKey("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
// Devnet USDC Mint
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export default function PaymentClient({ order }: { order: any }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setLoading(true);
    setError("");

    try {
      // 1. Setup Anchor Provider
      const provider = new anchor.AnchorProvider(
        connection, 
        wallet as any, 
        anchor.AnchorProvider.defaultOptions()
      );
      const program = new anchor.Program<CrewboardEscrow>(IDL, PROGRAM_ID, provider);
      
      // 2. Derive PDA for the Escrow State
      const [escrowStatePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          new PublicKey(order.seller.walletAddress).toBuffer(),
          Buffer.from(order.id)
        ],
        PROGRAM_ID
      );

      // 3. Find Token Accounts
      const buyerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
      
      // The escrow PDA's token account (where funds are locked)
      // We derive it deterministically or use anchor to init it
      const escrowTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT, 
        escrowStatePda,
        true // allow owner off curve (it's a PDA)
      );

      // 4. Execute the actual Anchor Instruction
      const txHash = await program.methods
        .initializeEscrow(
          order.id, 
          new anchor.BN(order.amount * 1000000) // Convert to 6 decimals
        )
        .accounts({
          buyer: wallet.publicKey,
          seller: new PublicKey(order.seller.walletAddress),
          mint: USDC_MINT,
          buyerTokenAccount: buyerTokenAccount,
          escrowState: escrowStatePda,
          escrowTokenAccount: escrowTokenAccount,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      
      console.log("On-chain Funding Success:", txHash);

      // 5. Update Database
      await updateOrderFunding(order.id, txHash);
      
      alert("Success! Funds have been locked in the Solana escrow contract.");
      router.push("/dashboard");
      router.refresh();

    } catch (e: any) {
      console.error("Payment Error:", e);
      // Handle case where user needs to create an ATA or has no USDC
      if (e.message?.includes("Account does not exist")) {
        setError("You don't have a USDC token account or insufficient balance.");
      } else {
        setError(e.message ?? "Transaction failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <button
        onClick={handlePayment}
        disabled={loading || !wallet.publicKey}
        className="btn-primary"
        style={{ width: "100%", cursor: "pointer" }}
      >
        {loading ? "SIGNING TRANSACTION..." : !wallet.publicKey ? "CONNECT WALLET" : `LOCK $${order.amount} USDC`}
      </button>
      
      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.8rem", textAlign: "center", marginTop: "0.75rem", fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(0,0,0,0.03)", borderRadius: "8px", fontSize: "0.75rem" }}>
        <div style={{ color: "rgba(0,0,0,0.5)", marginBottom: "0.25rem" }}>SMART CONTRACT</div>
        <div style={{ fontFamily: "Space Mono, monospace", wordBreak: "break-all" }}>{PROGRAM_ID.toBase58()}</div>
      </div>
    </div>
  );
}
