import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

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
 * Uses the same integer floor-division as the on-chain program so the numbers
 * are always consistent.
 *
 * @param grossAmount  Full order amount in USDC (whole dollars, NOT micro-USDC)
 * @returns { sellerAmount, feeAmount } in whole USDC dollars
 */
export function calcFee(grossAmount: number): { sellerAmount: number; feeAmount: number } {
  const feeAmount   = Math.floor((grossAmount * PLATFORM_FEE_BPS) / 10_000);
  const sellerAmount = grossAmount - feeAmount;
  return { sellerAmount, feeAmount };
}

// ─── IDL ─────────────────────────────────────────────────────────────────────

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
              { kind: "const",   value: [101, 115, 99, 114, 111, 119] }, // b"escrow"
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
    {
      name: "release_funds",
      discriminator: [225, 88, 91, 108, 126, 52, 2, 26],
      accounts: [
        { name: "buyer",                    writable: true, signer: true },
        { name: "seller",                   writable: true },
        {
          name: "escrow_state",
          writable: true,
          pda: {
            seeds: [
              { kind: "const",   value: [101, 115, 99, 114, 111, 119] },
              { kind: "account", path: "buyer" },
              { kind: "account", path: "seller" },
              { kind: "account", path: "escrow_state.gig_id" },
            ],
          },
        },
        { name: "escrow_token_account",     writable: true },
        { name: "seller_token_account",     writable: true },
        { name: "treasury_token_account",   writable: true }, // ← fee recipient
        { name: "token_program",            address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      ],
      args: [],
    },
    {
      name: "resolve_dispute",
      discriminator: [231, 6, 202, 6, 96, 103, 12, 230],
      accounts: [
        { name: "admin",                    writable: true, signer: true },
        { name: "buyer",                    writable: true },
        { name: "seller",                   writable: true },
        { name: "escrow_state",             writable: true },
        { name: "escrow_token_account",     writable: true },
        { name: "buyer_token_account",      writable: true },
        { name: "seller_token_account",     writable: true },
        { name: "treasury_token_account",   writable: true }, // ← fee when seller wins
        { name: "token_program",            address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      ],
      args: [{ name: "route_to_buyer", type: "bool" }],
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
): Promise<{ address: PublicKey; ix: ReturnType<typeof createAssociatedTokenAccountInstruction> | null }> {
  const address = await getAssociatedTokenAddress(USDC_MINT, owner);
  const info = await connection.getAccountInfo(address);
  return {
    address,
    ix: info ? null : createAssociatedTokenAccountInstruction(payer, address, owner, USDC_MINT),
  };
}

// ─── Instructions ─────────────────────────────────────────────────────────────

/**
 * Buyer locks the full gig price into escrow.
 * No fee is deducted here — the client pays exactly the service price.
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

  // Rust uses plain `init` (not ATA) for the escrow token account —
  // requires a fresh keypair to act as the new account address + signer.
  const escrowTokenAccountKeypair = Keypair.generate();
  const escrowTokenAccount = escrowTokenAccountKeypair.publicKey;

  const preInstructions = [];

  // Create buyer ATA if needed
  const buyerAtaInfo = await connection.getAccountInfo(buyerTokenAccount);
  if (!buyerAtaInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(buyer, buyerTokenAccount, buyer, USDC_MINT)
    );
  }

  const txHash = await program.methods
    .initializeEscrow(orderId, amount)
    .accounts({
      buyer,
      seller:           sellerPubkey,
      mint:             USDC_MINT,
      buyerTokenAccount,
      escrowState,
      escrowTokenAccount,
      // systemProgram, tokenProgram, rent — fixed addresses, auto-resolved by Anchor 0.30
    })
    .preInstructions(preInstructions)
    .signers([escrowTokenAccountKeypair])
    .rpc({ commitment: "confirmed" });

  return txHash;
}

/**
 * Buyer approves delivery and releases funds from escrow.
 * On-chain split: 90% → seller, 10% → treasury.
 * The treasury ATA is created automatically if it doesn't exist yet.
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

  // Read escrow token account address stored on-chain during fund
  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = state.escrowTokenAccount as PublicKey;

  const preInstructions: ReturnType<typeof createAssociatedTokenAccountInstruction>[] = [];

  // Seller ATA
  const { address: sellerTokenAccount, ix: sellerAtaIx } = await ensureAta(connection, buyer, sellerPubkey);
  if (sellerAtaIx) preInstructions.push(sellerAtaIx);

  // Treasury ATA — created by buyer if not present (small SOL cost, once only)
  const { address: treasuryTokenAccount, ix: treasuryAtaIx } = await ensureAta(connection, buyer, TREASURY_WALLET);
  if (treasuryAtaIx) preInstructions.push(treasuryAtaIx);

  const txHash = await program.methods
    .releaseFunds()
    .accounts({
      buyer,
      seller: sellerPubkey,
      escrowState,
      escrowTokenAccount,
      sellerTokenAccount,
      treasuryTokenAccount,
      // tokenProgram — fixed address, auto-resolved by Anchor 0.30
    })
    .preInstructions(preInstructions)
    .rpc({ commitment: "confirmed" });

  return txHash;
}

/**
 * Admin resolves a disputed order.
 * route_to_buyer=true  → full refund to buyer, no fee.
 * route_to_buyer=false → 90% to seller, 10% to treasury.
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
  const escrowTokenAccount = state.escrowTokenAccount as PublicKey;

  const preInstructions: ReturnType<typeof createAssociatedTokenAccountInstruction>[] = [];

  const { address: buyerTokenAccount,  ix: buyerAtaIx }    = await ensureAta(connection, adminWallet.publicKey, buyerPubkey);
  const { address: sellerTokenAccount, ix: sellerAtaIx }   = await ensureAta(connection, adminWallet.publicKey, sellerPubkey);
  const { address: treasuryTokenAccount, ix: treasuryAtaIx } = await ensureAta(connection, adminWallet.publicKey, TREASURY_WALLET);

  if (buyerAtaIx)    preInstructions.push(buyerAtaIx);
  if (sellerAtaIx)   preInstructions.push(sellerAtaIx);
  if (treasuryAtaIx) preInstructions.push(treasuryAtaIx);

  const txHash = await program.methods
    .resolveDispute(routeToBuyer)
    .accounts({
      admin: adminWallet.publicKey,
      buyer: buyerPubkey,
      seller: sellerPubkey,
      escrowState,
      escrowTokenAccount,
      buyerTokenAccount,
      sellerTokenAccount,
      treasuryTokenAccount,
      // tokenProgram — fixed address, auto-resolved by Anchor 0.30
    })
    .preInstructions(preInstructions)
    .rpc({ commitment: "confirmed" });

  return txHash;
}
