/**
 * Server-safe escrow transaction builders.
 *
 * These functions build UNSIGNED Solana transactions and return them as
 * base64 strings.  The iOS client deserialises, signs with the user's
 * wallet, submits to the RPC, and then POSTs the confirmed txHash back
 * to our backend to flip the order status in the DB.
 *
 * No wallet-adapter imports — safe to call from Next.js API routes
 * (Node.js runtime only, not Edge).
 */

import { createHash } from "crypto";
import {
  Connection, PublicKey, Transaction, TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  getAccount,
  createAssociatedTokenAccountIdempotentInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor";

// ─── Constants (must match src/lib/escrow.ts exactly) ─────────────────────────

export const PROGRAM_ID    = new PublicKey("9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp");
export const USDC_MINT     = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
export const USDC_DECIMALS = 6;
export const TREASURY_WALLET = new PublicKey("Fn95Cx5iUhwVTUB6ZL3B8CmBYpbFYB2MSepa1xdeT68q");
const TOKEN_PROGRAM_ID     = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

const DISCRIMINATORS = {
  release_funds:       Buffer.from([225, 88,  91, 108, 126, 52,  2,  26]),
  mark_delivered:      Buffer.from([240, 118, 188, 142,  64, 85, 107,  18]),
  admin_force_release: Buffer.from([200, 234, 233, 163, 162, 108, 177, 214]),
  admin_refund:        Buffer.from([130, 120,  82, 192, 147, 208, 173,  54]),
};

// Minimal IDL needed for initialize_escrow via Anchor (.transaction() call)
const IDL = {
  address: "9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp",
  metadata: { name: "crewboard_escrow", version: "0.1.0", spec: "0.1.0" },
  instructions: [{
    name: "initialize_escrow",
    discriminator: [243, 160, 77, 153, 11, 92, 48, 209],
    accounts: [
      { name: "buyer",                writable: true, signer: true },
      { name: "seller" },
      { name: "mint" },
      { name: "buyer_token_account",  writable: true },
      { name: "escrow_state",         writable: true, signer: false,
        pda: { seeds: [
          { kind: "const",   value: [101, 115, 99, 114, 111, 119] },
          { kind: "account", path: "buyer" },
          { kind: "account", path: "seller" },
          { kind: "arg",     path: "gig_id" },
        ]},
      },
      { name: "escrow_token_account", writable: true },
      { name: "system_program",       address: "11111111111111111111111111111111" },
      { name: "token_program",        address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    ],
    args: [
      { name: "gig_id", type: "string" },
      { name: "amount", type: "u64" },
    ],
  }],
  accounts: [{ name: "EscrowState", discriminator: [19, 90, 148, 111, 55, 130, 229, 108] }],
  types: [{
    name: "EscrowState",
    type: { kind: "struct", fields: [
      { name: "buyer",                type: "pubkey" },
      { name: "seller",               type: "pubkey" },
      { name: "mint",                 type: "pubkey" },
      { name: "escrow_token_account", type: "pubkey" },
      { name: "gig_id",               type: "string" },
      { name: "amount",               type: "u64" },
      { name: "bump",                 type: "u8" },
      { name: "created_at",           type: "i64" },
      { name: "delivered_at",         type: "i64" },
      { name: "is_delivered",         type: "bool" },
    ]},
  }],
} as unknown as Idl;

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _connection: Connection | null = null;
export function getSolanaConnection(): Connection {
  if (!_connection) {
    const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
    _connection = new Connection(rpc, "confirmed");
  }
  return _connection;
}

export function deriveEscrowPDA(
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  orderId: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), buyerPubkey.toBuffer(), sellerPubkey.toBuffer(), Buffer.from(orderId)],
    PROGRAM_ID,
  );
}

export function deriveEscrowVault(escrowStatePDA: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(USDC_MINT, escrowStatePDA, true);
}

export type VaultVerifyResult =
  | { ok: true; txHashHint?: string }
  | { ok: false; error: string; rpcError: boolean };

interface EscrowVerifyOptions {
  /** Resolve the real txHash from chain history (used when client sends "recovered"). */
  resolveRealTxHash?: boolean;
  /** When provided, recompute the expected PDA and reject if it doesn't match escrowAddress. */
  buyerAddress?: string;
  sellerAddress?: string;
  orderId?: string;
}

/**
 * Recompute the expected escrow PDA from DB-sourced keys and reject if it doesn't match
 * the client-supplied address. Returns a VaultVerifyResult error on mismatch, null on pass.
 * Must be called before any RPC call so mismatches are caught without network round-trips.
 */
function validateEscrowPDA(
  escrowStatePDA: PublicKey,
  buyerAddress: string,
  sellerAddress: string,
  orderId: string,
): VaultVerifyResult | null {
  let expectedPDA: PublicKey;
  try {
    [expectedPDA] = deriveEscrowPDA(
      new PublicKey(buyerAddress),
      new PublicKey(sellerAddress),
      orderId,
    );
  } catch {
    return { ok: false, error: "Invalid wallet address stored for this order.", rpcError: false };
  }
  if (!expectedPDA.equals(escrowStatePDA)) {
    return {
      ok: false,
      error: "Escrow address does not match this order — possible replay attack.",
      rpcError: false,
    };
  }
  return null;
}

/**
 * Verify the escrow vault exists on-chain and holds at least the expected USDC.
 *
 * PDA validation: when buyerAddress + sellerAddress + orderId are all supplied, the
 * function recomputes the expected PDA and rejects any escrowAddress that doesn't match —
 * blocking replay attacks where a buyer passes another order's funded escrow.
 *
 * rpcError: true means an RPC connectivity failure. Callers must REJECT the request
 * (fail closed) and return a 503 so the client retries. Do NOT proceed when rpcError=true.
 */
export async function verifyEscrowVaultFunded(
  escrowAddress: string,
  expectedAmountUsdc: number,
  options?: EscrowVerifyOptions,
): Promise<VaultVerifyResult> {
  try {
    const escrowStatePDA = new PublicKey(escrowAddress);

    if (options?.buyerAddress && options?.sellerAddress && options?.orderId) {
      const pdaError = validateEscrowPDA(escrowStatePDA, options.buyerAddress, options.sellerAddress, options.orderId);
      if (pdaError) return pdaError;
    }

    const vaultATA = deriveEscrowVault(escrowStatePDA);
    const connection = getSolanaConnection();

    const vaultAccount = await getAccount(connection, vaultATA, "confirmed").catch(() => null);
    if (!vaultAccount) {
      return {
        ok: false,
        error:
          "Escrow vault not found on-chain. The funding transaction may not have confirmed — " +
          "wait a moment and try again.",
        rpcError: false,
      };
    }

    const expectedMicroUsdc = BigInt(expectedAmountUsdc) * BigInt(10 ** USDC_DECIMALS);
    if (vaultAccount.amount < expectedMicroUsdc) {
      return {
        ok: false,
        error:
          `Escrow underfunded: vault holds ${Number(vaultAccount.amount) / 10 ** USDC_DECIMALS} USDC, ` +
          `expected ${expectedAmountUsdc} USDC.`,
        rpcError: false,
      };
    }

    let txHashHint: string | undefined;
    if (options?.resolveRealTxHash) {
      const sigs = await connection.getSignaturesForAddress(vaultATA, { limit: 1 }).catch(() => []);
      txHashHint = sigs[0]?.signature;
    }

    return { ok: true, txHashHint };
  } catch (e: any) {
    console.error("[verifyEscrowVaultFunded] RPC error:", e?.message);
    return { ok: false, error: e?.message ?? "RPC error", rpcError: true };
  }
}

/**
 * Verify that the escrow vault has been emptied (release_funds / admin_force_release /
 * resolve_dispute all close the vault ATA via close_account CPI).
 *
 * A null vaultAccount means the ATA was closed — release confirmed.
 * A non-null account with amount === 0n is also treated as released.
 * Any positive balance means the release has NOT been executed on-chain.
 *
 * Fail closed on rpcError — callers must NOT mark the order complete without confirmation.
 */
export async function verifyEscrowReleased(
  escrowAddress: string,
  options?: EscrowVerifyOptions,
): Promise<VaultVerifyResult> {
  try {
    const escrowStatePDA = new PublicKey(escrowAddress);

    if (options?.buyerAddress && options?.sellerAddress && options?.orderId) {
      const pdaError = validateEscrowPDA(escrowStatePDA, options.buyerAddress, options.sellerAddress, options.orderId);
      if (pdaError) return pdaError;
    }

    const vaultATA = deriveEscrowVault(escrowStatePDA);
    const connection = getSolanaConnection();
    const vaultAccount = await getAccount(connection, vaultATA, "confirmed").catch(() => null);

    // ATA closed by close_account CPI — release confirmed
    if (!vaultAccount || vaultAccount.amount === BigInt(0)) return { ok: true };

    return {
      ok: false,
      error: "Escrow vault still holds funds — release not confirmed on-chain.",
      rpcError: false,
    };
  } catch (e: any) {
    console.error("[verifyEscrowReleased] RPC error:", e?.message);
    return { ok: false, error: e?.message ?? "RPC error", rpcError: true };
  }
}

/**
 * Validate that DISCRIMINATORS constants match what Anchor derives from instruction names.
 * Anchor discriminator formula: sha256("global:<snake_case_name>")[..8]
 *
 * Run this in CI after any `anchor build` / program upgrade:
 *   const { valid, errors } = validateDiscriminators();
 *   if (!valid) throw new Error(errors.join("\n"));
 */
export function validateDiscriminators(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [name, hardcoded] of Object.entries(DISCRIMINATORS)) {
    const expected = Buffer.from(
      createHash("sha256").update(`global:${name}`).digest(),
    ).subarray(0, 8);
    if (!hardcoded.equals(expected)) {
      errors.push(
        `"${name}": expected ${expected.toString("hex")}, got ${hardcoded.toString("hex")}`,
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Serialise an unsigned transaction to base64. */
function serialise(tx: Transaction): string {
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
}

/** Build a provider with a read-only fake wallet — safe for .transaction() calls. */
function buildProvider(connection: Connection, feePayer: PublicKey): AnchorProvider {
  const fakeWallet = {
    publicKey: feePayer,
    signTransaction:    async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
  return new AnchorProvider(connection, fakeWallet as any, { commitment: "confirmed" });
}

// ─── Build functions ──────────────────────────────────────────────────────────

/**
 * Build an unsigned initialize_escrow transaction.
 * Signer = buyer.
 * Returns base64 serialised transaction + the escrow PDA address.
 */
export async function buildFundTx(
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  orderId: string,
  amountUsd: number,
): Promise<{ tx: string; escrowAddress: string }> {
  const connection  = getSolanaConnection();
  const provider    = buildProvider(connection, buyerPubkey);
  const program     = new Program(IDL, provider);
  const amount      = new BN(Math.round(amountUsd * Math.pow(10, USDC_DECIMALS)));
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);
  const escrowTokenAccount = deriveEscrowVault(escrowState);
  const buyerTokenAccount  = getAssociatedTokenAddressSync(USDC_MINT, buyerPubkey);

  // Pre-instruction: idempotent vault ATA creation
  const preIx = createAssociatedTokenAccountIdempotentInstruction(
    buyerPubkey, escrowTokenAccount, escrowState, USDC_MINT,
  );

  // Also ensure buyer ATA (idempotent)
  const buyerAtaInfo = await connection.getAccountInfo(buyerTokenAccount);
  const buyerAtaIx = buyerAtaInfo ? null : createAssociatedTokenAccountInstruction(
    buyerPubkey, buyerTokenAccount, buyerPubkey, USDC_MINT,
  );

  const preInstructions = [...(buyerAtaIx ? [buyerAtaIx] : []), preIx];

  const tx = await (program.methods as any)
    .initializeEscrow(orderId, amount)
    .accountsStrict({
      buyer:               buyerPubkey,
      seller:              sellerPubkey,
      mint:                USDC_MINT,
      buyerTokenAccount,
      escrowState,
      escrowTokenAccount,
      systemProgram:       SystemProgram.programId,
      tokenProgram:        TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .transaction() as Transaction;

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = buyerPubkey;

  return { tx: serialise(tx), escrowAddress: escrowState.toBase58() };
}

/**
 * Build an unsigned release_funds transaction.
 * Signer = buyer.
 * Fetches escrow state on-chain to get the vault address.
 */
export async function buildReleaseTx(
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  orderId: string,
): Promise<{ tx: string }> {
  const connection = getSolanaConnection();
  const provider   = buildProvider(connection, buyerPubkey);
  const program    = new Program(IDL, provider);
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);

  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);

  const sellerTokenAccount  = getAssociatedTokenAddressSync(USDC_MINT, sellerPubkey);
  const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_WALLET);

  const instructions: TransactionInstruction[] = [];

  const sellerAtaInfo   = await connection.getAccountInfo(sellerTokenAccount);
  const treasuryAtaInfo = await connection.getAccountInfo(treasuryTokenAccount);

  if (!sellerAtaInfo) {
    instructions.push(createAssociatedTokenAccountInstruction(buyerPubkey, sellerTokenAccount, sellerPubkey, USDC_MINT));
  }
  if (!treasuryAtaInfo) {
    instructions.push(createAssociatedTokenAccountInstruction(buyerPubkey, treasuryTokenAccount, TREASURY_WALLET, USDC_MINT));
  }

  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: buyerPubkey,          isSigner: true,  isWritable: true  },
      { pubkey: sellerPubkey,         isSigner: false, isWritable: false },
      { pubkey: escrowState,          isSigner: false, isWritable: true  },
      { pubkey: escrowTokenAccount,   isSigner: false, isWritable: true  },
      { pubkey: sellerTokenAccount,   isSigner: false, isWritable: true  },
      { pubkey: TREASURY_WALLET,      isSigner: false, isWritable: false },
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,     isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.release_funds,
  }));

  const tx = new Transaction();
  instructions.forEach((ix) => tx.add(ix));
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = buyerPubkey;

  return { tx: serialise(tx) };
}

/**
 * Build an unsigned mark_delivered transaction.
 * Signer = seller.
 */
export async function buildMarkDeliveredTx(
  sellerPubkey: PublicKey,
  buyerPubkey: PublicKey,
  orderId: string,
  escrowAddressPDA?: string | null,
): Promise<{ tx: string }> {
  const connection = getSolanaConnection();
  // Prefer the stored escrow address — buyer may have funded from a different wallet
  // than what's stored in their profile, which would produce the wrong PDA.
  const escrowState = escrowAddressPDA
    ? new PublicKey(escrowAddressPDA)
    : deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId)[0];

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: sellerPubkey, isSigner: true,  isWritable: false },
      { pubkey: escrowState,  isSigner: false, isWritable: true  },
    ],
    data: DISCRIMINATORS.mark_delivered,
  });

  const tx = new Transaction();
  tx.add(ix);
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = sellerPubkey;

  return { tx: serialise(tx) };
}

/**
 * Build an unsigned admin_force_release transaction.
 * Signer = admin wallet.
 * Requires: is_delivered == true AND now > delivered_at + 14 days.
 */
export async function buildAdminForceReleaseTx(
  adminPubkey: PublicKey,
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  orderId: string,
): Promise<{ tx: string }> {
  const connection = getSolanaConnection();
  const provider   = buildProvider(connection, adminPubkey);
  const program    = new Program(IDL, provider);
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);

  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount  = new PublicKey(state.escrowTokenAccount);
  const sellerTokenAccount  = getAssociatedTokenAddressSync(USDC_MINT, sellerPubkey);
  const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_WALLET);

  const instructions: TransactionInstruction[] = [];

  const sellerAtaInfo   = await connection.getAccountInfo(sellerTokenAccount);
  const treasuryAtaInfo = await connection.getAccountInfo(treasuryTokenAccount);
  if (!sellerAtaInfo)   instructions.push(createAssociatedTokenAccountInstruction(adminPubkey, sellerTokenAccount,   sellerPubkey,    USDC_MINT));
  if (!treasuryAtaInfo) instructions.push(createAssociatedTokenAccountInstruction(adminPubkey, treasuryTokenAccount, TREASURY_WALLET, USDC_MINT));

  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: adminPubkey,          isSigner: true,  isWritable: true  },
      { pubkey: buyerPubkey,          isSigner: false, isWritable: true  },
      { pubkey: sellerPubkey,         isSigner: false, isWritable: false },
      { pubkey: escrowState,          isSigner: false, isWritable: true  },
      { pubkey: escrowTokenAccount,   isSigner: false, isWritable: true  },
      { pubkey: sellerTokenAccount,   isSigner: false, isWritable: true  },
      { pubkey: TREASURY_WALLET,      isSigner: false, isWritable: false },
      { pubkey: treasuryTokenAccount, isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,     isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.admin_force_release,
  }));

  const tx = new Transaction();
  instructions.forEach((ix) => tx.add(ix));
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = adminPubkey;

  return { tx: serialise(tx) };
}

/**
 * Build an unsigned admin_refund transaction.
 * Signer = admin wallet.
 * Requires: is_delivered == false AND now > created_at + 14 days.
 * Full refund to buyer, no fee taken.
 */
export async function buildAdminRefundTx(
  adminPubkey: PublicKey,
  buyerPubkey: PublicKey,
  sellerPubkey: PublicKey,
  orderId: string,
): Promise<{ tx: string }> {
  const connection = getSolanaConnection();
  const provider   = buildProvider(connection, adminPubkey);
  const program    = new Program(IDL, provider);
  const [escrowState] = deriveEscrowPDA(buyerPubkey, sellerPubkey, orderId);

  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = new PublicKey(state.escrowTokenAccount);
  const buyerTokenAccount  = getAssociatedTokenAddressSync(USDC_MINT, buyerPubkey);

  const instructions: TransactionInstruction[] = [];

  const buyerAtaInfo = await connection.getAccountInfo(buyerTokenAccount);
  if (!buyerAtaInfo) {
    instructions.push(createAssociatedTokenAccountInstruction(adminPubkey, buyerTokenAccount, buyerPubkey, USDC_MINT));
  }

  instructions.push(new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: adminPubkey,         isSigner: true,  isWritable: true  },
      { pubkey: buyerPubkey,         isSigner: false, isWritable: true  },
      { pubkey: sellerPubkey,        isSigner: false, isWritable: false },
      { pubkey: escrowState,         isSigner: false, isWritable: true  },
      { pubkey: escrowTokenAccount,  isSigner: false, isWritable: true  },
      { pubkey: buyerTokenAccount,   isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATORS.admin_refund,
  }));

  const tx = new Transaction();
  instructions.forEach((ix) => tx.add(ix));
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = adminPubkey;

  return { tx: serialise(tx) };
}
