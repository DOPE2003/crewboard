/**
 * Crewboard Escrow SMART CONTRACT
 * -----------------------------------------
 * Author: SAAD AIT HAMMOU CTO of Crewboard
 * Project: Crewboard
 * Year: 2026
 *
 * Program ID: 9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp
 * Treasury Wallet: Fn95Cx5iUhwVTUB6ZL3B8CmBYpbFYB2MSepa1xdeT68q
 *
 * All rights reserved.
 */
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import {
  Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY,
  Transaction, TransactionInstruction, ComputeBudgetProgram,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

// Hardcoded to avoid any import resolution issues with @solana/spl-token versions
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// ─── Constants ───────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey("9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp");

// Devnet USDC mint
export const USDC_MINT    = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_DECIMALS = 6;

/** Platform treasury wallet — receives 10% fee on every release. */
export const TREASURY_WALLET = new PublicKey("Fn95Cx5iUhwVTUB6ZL3B8CmBYpbFYB2MSepa1xdeT68q");

/** Fee rate in basis points (1 000 / 10 000 = 10%). */
export const PLATFORM_FEE_BPS = 1_000;

/**
 * Calculate the seller net payout and platform fee for a given gross amount.
 * Uses the same integer floor-division as the on-chain program.
 */
export function calcFee(grossAmount: number): { sellerAmount: number; feeAmount: number } {
  const feeAmount   = Math.floor((grossAmount * PLATFORM_FEE_BPS) / 10_000);
  const sellerAmount = grossAmount - feeAmount;
  return { sellerAmount, feeAmount };
}

// ─── IDL (used only for fundEscrow + state reads) ────────────────────────────

const IDL: Idl = {
  address: "9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp",
  metadata: { name: "crewboard_escrow", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "initialize_escrow",
      discriminator: [243, 160, 77, 153, 11, 92, 48, 209],
      accounts: [
        { name: "buyer",                writable: true, signer: true },
        { name: "seller" },
        { name: "mint" },
        { name: "buyer_token_account",  writable: true },
        {
          name: "escrow_state",
          writable: true,
          signer: false,
          pda: {
            seeds: [
              { kind: "const",   value: [101, 115, 99, 114, 111, 119] },
              { kind: "account", path: "buyer" },
              { kind: "account", path: "seller" },
              { kind: "arg",     path: "gig_id" },
            ],
          },
        },
        { name: "escrow_token_account", writable: true, signer: true },
        { name: "system_program",       address: "11111111111111111111111111111111" },
        { name: "token_program",        address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "rent",                 address: "SysvarRent111111111111111111111111111111111" },
      ],
      args: [
        { name: "gig_id", type: "string" },
        { name: "amount", type: "u64" },
      ],
    },
    // release_funds and resolve_dispute are called via raw instructions below
    // (Anchor 0.30 TS client is incompatible with Anchor 0.31 on-chain IDL format)
  ],
  accounts: [
    {
      name: "EscrowState",
      discriminator: [19, 90, 148, 111, 55, 130, 229, 108],
    },
  ],
  types: [
    {
      name: "EscrowState",
      type: {
        kind: "struct",
        fields: [
          { name: "buyer",                 type: "pubkey" },
          { name: "seller",                type: "pubkey" },
          { name: "mint",                  type: "pubkey" },
          { name: "escrow_token_account",  type: "pubkey" },
          { name: "gig_id",                type: "string" },
          { name: "amount",                type: "u64" },
          { name: "bump",                  type: "u8" },
        ],
      },
    },
  ],
} as unknown as Idl;

// ─── Instruction discriminators (from Anchor 0.31 IDL) ───────────────────────

// Used for raw instruction construction — bypasses TS client version mismatch
const DISCRIMINATORS = {
  release_funds:   Buffer.from([225, 88, 91, 108, 126, 52, 2, 26]),
  resolve_dispute: Buffer.from([231, 6, 202, 6, 96, 103, 12, 230]),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getProgram(wallet: AnchorWallet, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program(IDL, provider);
}

export function deriveEscrowPDA(
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  orderId: string,
) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      buyerPubkey.toBuffer(),
      sellerPubkey.toBuffer(),
      Buffer.from(orderId),
    ],
    PROGRAM_ID,
  );
}

/** Ensure a USDC ATA exists; returns a create instruction if it doesn't. */
async function ensureAta(
  connection: Connection,
  payer: PublicKey,
  owner: PublicKey,
): Promise<{ address: PublicKey; ix: TransactionInstruction | null }> {
  const address = await getAssociatedTokenAddress(USDC_MINT, owner);
  const info = await connection.getAccountInfo(address);
  return {
    address,
    ix: info ? null : createAssociatedTokenAccountInstruction(payer, address, owner, USDC_MINT),
  };
}

/** Send a signed transaction and wait for confirmation. */
async function sendAndConfirm(
  wallet: AnchorWallet,
  connection: Connection,
  instructions: TransactionInstruction[],
): Promise<string> {
  const tx = new Transaction();
  instructions.forEach((ix) => tx.add(ix));

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  const signed = await wallet.signTransaction(tx);
  const txHash = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(
    { signature: txHash, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return txHash;
}

// ─── Instructions ─────────────────────────────────────────────────────────────

/**
 * Buyer locks the full gig price into escrow.
 * Uses Anchor client (initialize_escrow works fine with 0.30.1).
 */
export async function fundEscrow(
  wallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  sellerPubkey: PublicKey,
  amountUsd: number,
): Promise<string> {
  const program = getProgram(wallet, connection);
  const buyer = wallet.publicKey;
  const amount = new BN(Math.round(amountUsd * Math.pow(10, USDC_DECIMALS)));

  const [escrowState] = deriveEscrowPDA(buyer, sellerPubkey, orderId);
  const buyerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, buyer);

  const escrowTokenAccountKeypair = Keypair.generate();
  const escrowTokenAccount = escrowTokenAccountKeypair.publicKey;

  const preInstructions: TransactionInstruction[] = [];

  const buyerAtaInfo = await connection.getAccountInfo(buyerTokenAccount);
  if (!buyerAtaInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(buyer, buyerTokenAccount, buyer, USDC_MINT)
    );
  }

  const txHash = await program.methods
    .initializeEscrow(orderId, amount)
    .accountsStrict({
      buyer,
      seller:           sellerPubkey,
      mint:             USDC_MINT,
      buyerTokenAccount,
      escrowState,
      escrowTokenAccount,
      systemProgram:    SystemProgram.programId,
      tokenProgram:     TOKEN_PROGRAM_ID,
      rent:             SYSVAR_RENT_PUBKEY,
    })
    .preInstructions(preInstructions)
    .signers([escrowTokenAccountKeypair])
    .rpc({ commitment: "confirmed" });

  return txHash;
}

/**
 * Buyer approves delivery and releases funds from escrow.
 * Built as a raw instruction to avoid Anchor 0.30/0.31 client IDL mismatch.
 * On-chain split: 90% → seller, 10% → treasury.
 */
export async function releaseFunds(
  wallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  sellerPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(wallet, connection);
  const buyer = wallet.publicKey;
  const [escrowState] = deriveEscrowPDA(buyer, sellerPubkey, orderId);

  // Fetch the escrow token account address stored on-chain during fund
  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);

  const instructions: TransactionInstruction[] = [];

  // Create seller ATA if needed
  const { address: sellerTokenAccount, ix: sellerAtaIx } = await ensureAta(connection, buyer, sellerPubkey);
  if (sellerAtaIx) instructions.push(sellerAtaIx);

  // Create treasury ATA if needed (one-time SOL cost paid by buyer)
  const { address: treasuryTokenAccount, ix: treasuryAtaIx } = await ensureAta(connection, buyer, TREASURY_WALLET);
  if (treasuryAtaIx) instructions.push(treasuryAtaIx);

  // Raw release_funds instruction — bypasses Anchor TS client version mismatch
  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: buyer,                 isSigner: true,  isWritable: true  },
      { pubkey: sellerPubkey,          isSigner: false, isWritable: true  },
      { pubkey: escrowState,           isSigner: false, isWritable: true  },
      { pubkey: escrowTokenAccount,    isSigner: false, isWritable: true  },
      { pubkey: sellerTokenAccount,    isSigner: false, isWritable: true  },
      { pubkey: treasuryTokenAccount,  isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,      isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.release_funds,
  }));

  return sendAndConfirm(wallet, connection, instructions);
}

/**
 * Admin resolves a disputed order.
 * routeToBuyer=true  → full refund to buyer, no fee.
 * routeToBuyer=false → 90% to seller, 10% to treasury.
 * Built as a raw instruction for the same version-mismatch reason.
 */
export async function resolveDispute(
  adminWallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  routeToBuyer: boolean,
): Promise<string> {
  const program = getProgram(adminWallet, connection);
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);

  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);

  const instructions: TransactionInstruction[] = [];

  const { address: buyerTokenAccount,    ix: buyerAtaIx    } = await ensureAta(connection, adminWallet.publicKey, buyerPubkey);
  const { address: sellerTokenAccount,   ix: sellerAtaIx   } = await ensureAta(connection, adminWallet.publicKey, sellerPubkey);
  const { address: treasuryTokenAccount, ix: treasuryAtaIx } = await ensureAta(connection, adminWallet.publicKey, TREASURY_WALLET);

  if (buyerAtaIx)    instructions.push(buyerAtaIx);
  if (sellerAtaIx)   instructions.push(sellerAtaIx);
  if (treasuryAtaIx) instructions.push(treasuryAtaIx);

  // Borsh-encode the bool argument (1 byte)
  const data = Buffer.concat([
    DISCRIMINATORS.resolve_dispute,
    Buffer.from([routeToBuyer ? 1 : 0]),
  ]);

  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: adminWallet.publicKey, isSigner: true,  isWritable: true  },
      { pubkey: buyerPubkey,           isSigner: false, isWritable: true  },
      { pubkey: sellerPubkey,          isSigner: false, isWritable: true  },
      { pubkey: escrowState,           isSigner: false, isWritable: true  },
      { pubkey: escrowTokenAccount,    isSigner: false, isWritable: true  },
      { pubkey: buyerTokenAccount,     isSigner: false, isWritable: true  },
      { pubkey: sellerTokenAccount,    isSigner: false, isWritable: true  },
      { pubkey: treasuryTokenAccount,  isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,      isSigner: false, isWritable: false },
    ],
    data,
  }));

  return sendAndConfirm(adminWallet, connection, instructions);
}
