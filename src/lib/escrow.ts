/**
 * Crewboard Escrow SMART CONTRACT — TypeScript Client
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
  Connection, PublicKey, SystemProgram,
  Transaction, TransactionInstruction, ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

// Hardcoded to avoid import resolution issues with @solana/spl-token versions
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// ─── Constants ───────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey("9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp");

// Devnet USDC mint
export const USDC_MINT     = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_DECIMALS = 6;

/** Platform treasury wallet — receives 10% fee on every release.
 *  Must match TREASURY_PUBKEY constant in lib.rs exactly. */
export const TREASURY_WALLET = new PublicKey("Fn95Cx5iUhwVTUB6ZL3B8CmBYpbFYB2MSepa1xdeT68q");

/** Fee rate in basis points (1 000 / 10 000 = 10%). */
export const PLATFORM_FEE_BPS = 1_000;

export function calcFee(grossAmount: number): { sellerAmount: number; feeAmount: number } {
  const feeAmount    = Math.floor((grossAmount * PLATFORM_FEE_BPS) / 10_000);
  const sellerAmount = grossAmount - feeAmount;
  return { sellerAmount, feeAmount };
}

// ─── IDL ─────────────────────────────────────────────────────────────────────
// Only initialize_escrow uses the Anchor client (program.methods).
// All other instructions are built as raw TransactionInstructions to avoid
// Anchor TS 0.30 / on-chain 0.31 IDL format mismatches.
//
// IMPORTANT: After running `anchor build`, copy the discriminators from:
//   crewboard_escrow/target/idl/crewboard_escrow.json
// and update DISCRIMINATORS below.

const IDL: Idl = {
  address: "9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp",
  metadata: { name: "crewboard_escrow", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "initialize_escrow",
      discriminator: [243, 160, 77, 153, 11, 92, 48, 209],
      accounts: [
        { name: "buyer",                   writable: true, signer: true },
        { name: "seller" },
        { name: "mint" },
        { name: "buyer_token_account",     writable: true },
        {
          name: "escrow_state",
          writable: true,
          signer: false,
          pda: {
            seeds: [
              { kind: "const",   value: [101, 115, 99, 114, 111, 119] }, // b"escrow"
              { kind: "account", path: "buyer" },
              { kind: "account", path: "seller" },
              { kind: "arg",     path: "gig_id" },
            ],
          },
        },
        // escrow_token_account is now an ATA (init, associated_token::*) — NOT a signer
        { name: "escrow_token_account",    writable: true },
        { name: "system_program",          address: "11111111111111111111111111111111" },
        { name: "token_program",           address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "associated_token_program",address: "ATokenGPvbdGVxr1b2NG6aJZVSyMuVe5MxBfKF5SbFDPc" },
        // rent sysvar removed — no longer in the InitializeEscrow struct
      ],
      args: [
        { name: "gig_id", type: "string" },
        { name: "amount", type: "u64" },
      ],
    },
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
          { name: "buyer",                type: "pubkey" },
          { name: "seller",               type: "pubkey" },
          { name: "mint",                 type: "pubkey" },
          { name: "escrow_token_account", type: "pubkey" },
          { name: "gig_id",               type: "string" },
          { name: "amount",               type: "u64" },
          { name: "bump",                 type: "u8" },
          // New fields added in the updated program:
          { name: "created_at",           type: "i64" },
          { name: "delivered_at",         type: "i64" },
          { name: "is_delivered",         type: "bool" },
        ],
      },
    },
  ],
} as unknown as Idl;

// ─── Instruction discriminators ───────────────────────────────────────────────
// sha256("global:<instruction_name>")[0..8]
//
// After `anchor build`, verify/update these from:
//   crewboard_escrow/target/idl/crewboard_escrow.json → instructions[*].discriminator
//
// release_funds name is unchanged → discriminator is unchanged.
// mark_delivered / admin_force_release / admin_refund are new — copy from IDL after build.

const DISCRIMINATORS = {
  release_funds:      Buffer.from([225, 88,  91, 108, 126, 52,  2,  26]),
  // TODO: run `anchor build` and copy from target/idl/crewboard_escrow.json:
  mark_delivered:      Buffer.from([240, 118, 188, 142,  64, 85, 107,  18]),
  admin_force_release: Buffer.from([200, 234, 233, 163, 162, 108, 177, 214]),
  admin_refund:        Buffer.from([130, 120,  82, 192, 147, 208, 173,  54]),
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

/**
 * Derive the escrow vault ATA.
 * The new program uses `init, associated_token::mint = mint, associated_token::authority = escrow_state`
 * so the vault address is always deterministic from (mint, escrow_state_PDA).
 * allowOwnerOffCurve = true because escrow_state is a PDA (off-curve pubkey).
 */
export function deriveEscrowVault(escrowStatePDA: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(USDC_MINT, escrowStatePDA, true);
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
 *
 * CHANGED from old version:
 * - escrow_token_account is now a deterministic ATA owned by the escrow PDA
 *   (no more random keypair / Signer)
 * - associated_token_program added to accounts
 * - rent sysvar removed (no longer in the Rust struct)
 */
export async function fundEscrow(
  wallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  sellerPubkey: PublicKey,
  amountUsd: number,
): Promise<string> {
  const program = getProgram(wallet, connection);
  const buyer  = wallet.publicKey;
  const amount = new BN(Math.round(amountUsd * Math.pow(10, USDC_DECIMALS)));

  const [escrowState] = deriveEscrowPDA(buyer, sellerPubkey, orderId);

  // Vault = ATA of (USDC_MINT, escrow_state PDA).
  // Must match the Rust constraint:
  //   associated_token::mint = mint, associated_token::authority = escrow_state
  const escrowTokenAccount = deriveEscrowVault(escrowState);

  const buyerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, buyer);

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
      seller:                 sellerPubkey,
      mint:                   USDC_MINT,
      buyerTokenAccount,
      escrowState,
      escrowTokenAccount,                          // ATA — not a signer
      systemProgram:          SystemProgram.programId,
      tokenProgram:           TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, // NEW
      // rent removed — no longer in the Rust struct
    })
    .preInstructions(preInstructions)
    .signers([])                                   // no keypair signer needed
    .rpc({ commitment: "confirmed" });

  return txHash;
}

/**
 * Seller marks the gig as delivered.
 * Sets is_delivered = true and stamps delivered_at on-chain.
 * Starts the 14-day AFK clock for admin_force_release.
 *
 * Accounts (must match MarkDelivered struct in lib.rs):
 *   0. seller        — Signer, has_one check
 *   1. escrow_state  — writable, seeds + bump + has_one = seller
 *
 * NOTE: Replace DISCRIMINATORS.mark_delivered after `anchor build`.
 */
export async function markDelivered(
  wallet: AnchorWallet,   // must be the seller
  connection: Connection,
  orderId: string,
  buyerPubkey: PublicKey,
): Promise<string> {
  const seller = wallet.publicKey;
  const [escrowState] = deriveEscrowPDA(buyerPubkey, seller, orderId);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: seller,      isSigner: true,  isWritable: false },
      { pubkey: escrowState, isSigner: false, isWritable: true  },
    ],
    data: DISCRIMINATORS.mark_delivered,
  });

  return sendAndConfirm(wallet, connection, [ix]);
}

/**
 * Buyer approves delivery and releases funds.
 * 90% → seller, 10% → treasury (on-chain, not client-side).
 *
 * Accounts (must match ReleaseFunds struct in lib.rs — 8 accounts):
 *   0. buyer                  — Signer, writable (receives rent from closed escrow_state)
 *   1. seller                 — NOT writable (has_one check)
 *   2. escrow_state           — writable, seeds + bump, has_one=buyer, has_one=seller, close=buyer
 *   3. escrow_token_account   — writable, address = escrow_state.escrow_token_account
 *   4. seller_token_account   — writable, token::authority = seller
 *   5. treasury               — NOT writable, address = TREASURY_PUBKEY in lib.rs  ← NEW ACCOUNT
 *   6. treasury_token_account — writable, token::authority = treasury
 *   7. token_program
 */
export async function releaseFunds(
  wallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  sellerPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(wallet, connection);
  const buyer  = wallet.publicKey;
  const [escrowState] = deriveEscrowPDA(buyer, sellerPubkey, orderId);

  // Read escrow_token_account address stored on-chain (set during fundEscrow)
  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);

  const instructions: TransactionInstruction[] = [];

  // Ensure seller ATA exists (one-time SOL cost, paid by buyer)
  const { address: sellerTokenAccount,   ix: sellerAtaIx   } = await ensureAta(connection, buyer, sellerPubkey);
  if (sellerAtaIx)   instructions.push(sellerAtaIx);

  // Ensure treasury ATA exists (one-time SOL cost, paid by buyer)
  const { address: treasuryTokenAccount, ix: treasuryAtaIx } = await ensureAta(connection, buyer, TREASURY_WALLET);
  if (treasuryAtaIx) instructions.push(treasuryAtaIx);

  // release_funds instruction — account order MUST exactly match ReleaseFunds struct in lib.rs
  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: buyer,                isSigner: true,  isWritable: true  }, // 0. buyer
      { pubkey: sellerPubkey,         isSigner: false, isWritable: false }, // 1. seller (NOT writable)
      { pubkey: escrowState,          isSigner: false, isWritable: true  }, // 2. escrow_state
      { pubkey: escrowTokenAccount,   isSigner: false, isWritable: true  }, // 3. escrow_token_account
      { pubkey: sellerTokenAccount,   isSigner: false, isWritable: true  }, // 4. seller_token_account
      { pubkey: TREASURY_WALLET,      isSigner: false, isWritable: false }, // 5. treasury ← NEW
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true  }, // 6. treasury_token_account
      { pubkey: TOKEN_PROGRAM_ID,     isSigner: false, isWritable: false }, // 7. token_program
    ],
    data: DISCRIMINATORS.release_funds,
  }));

  return sendAndConfirm(wallet, connection, instructions);
}

/**
 * Admin forces fund release after buyer goes AFK (14 days after delivery).
 * Requires: is_delivered == true AND now > delivered_at + 14 days.
 * Same 90/10 split as normal release.
 *
 * NOTE: Replace DISCRIMINATORS.admin_force_release after `anchor build`.
 */
export async function adminForceRelease(
  adminWallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(adminWallet, connection);
  const admin = adminWallet.publicKey;
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);

  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);

  const instructions: TransactionInstruction[] = [];

  const { address: sellerTokenAccount,   ix: sellerAtaIx   } = await ensureAta(connection, admin, sellerPubkey);
  const { address: treasuryTokenAccount, ix: treasuryAtaIx } = await ensureAta(connection, admin, TREASURY_WALLET);
  if (sellerAtaIx)   instructions.push(sellerAtaIx);
  if (treasuryAtaIx) instructions.push(treasuryAtaIx);

  // Accounts match AdminForceRelease struct in lib.rs
  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin,                isSigner: true,  isWritable: true  }, // 0. admin
      { pubkey: buyerPubkey,          isSigner: false, isWritable: true  }, // 1. buyer (receives rent)
      { pubkey: sellerPubkey,         isSigner: false, isWritable: false }, // 2. seller
      { pubkey: escrowState,          isSigner: false, isWritable: true  }, // 3. escrow_state
      { pubkey: escrowTokenAccount,   isSigner: false, isWritable: true  }, // 4. escrow_token_account
      { pubkey: sellerTokenAccount,   isSigner: false, isWritable: true  }, // 5. seller_token_account
      { pubkey: TREASURY_WALLET,      isSigner: false, isWritable: false }, // 6. treasury
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true  }, // 7. treasury_token_account
      { pubkey: TOKEN_PROGRAM_ID,     isSigner: false, isWritable: false }, // 8. token_program
    ],
    data: DISCRIMINATORS.admin_force_release,
  }));

  return sendAndConfirm(adminWallet, connection, instructions);
}

/**
 * Admin refunds buyer when seller goes AFK (never delivers, 14 days after creation).
 * Requires: is_delivered == false AND now > created_at + 14 days.
 * Full refund — no platform fee.
 *
 * NOTE: Replace DISCRIMINATORS.admin_refund after `anchor build`.
 */
export async function adminRefund(
  adminWallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
): Promise<string> {
  const program = getProgram(adminWallet, connection);
  const admin = adminWallet.publicKey;
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);

  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);

  const instructions: TransactionInstruction[] = [];

  const { address: buyerTokenAccount, ix: buyerAtaIx } = await ensureAta(connection, admin, buyerPubkey);
  if (buyerAtaIx) instructions.push(buyerAtaIx);

  // Accounts match AdminRefund struct in lib.rs
  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: admin,               isSigner: true,  isWritable: true  }, // 0. admin
      { pubkey: buyerPubkey,         isSigner: false, isWritable: true  }, // 1. buyer (receives refund + rent)
      { pubkey: sellerPubkey,        isSigner: false, isWritable: false }, // 2. seller (for PDA seeds)
      { pubkey: escrowState,         isSigner: false, isWritable: true  }, // 3. escrow_state
      { pubkey: escrowTokenAccount,  isSigner: false, isWritable: true  }, // 4. escrow_token_account
      { pubkey: buyerTokenAccount,   isSigner: false, isWritable: true  }, // 5. buyer_token_account
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false }, // 6. token_program
    ],
    data: DISCRIMINATORS.admin_refund,
  }));

  return sendAndConfirm(adminWallet, connection, instructions);
}
