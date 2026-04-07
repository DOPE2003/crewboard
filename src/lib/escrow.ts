import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

export const PROGRAM_ID = new PublicKey("9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp");

// Devnet USDC mint
export const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
export const USDC_DECIMALS = 6;

const IDL: Idl = {
  address: "9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp",
  metadata: { name: "crewboard_escrow", version: "0.1.0", spec: "0.1.0" },
  instructions: [
    {
      name: "initialize_escrow",
      discriminator: [243, 160, 77, 153, 11, 92, 48, 209],
      accounts: [
        { name: "buyer", writable: true, signer: true },
        { name: "seller" },
        { name: "mint" },
        { name: "buyer_token_account", writable: true },
        { name: "escrow_state", writable: true, signer: false, pda: { seeds: [{ kind: "const", value: [101,115,99,114,111,119] }, { kind: "account", path: "buyer" }, { kind: "account", path: "seller" }, { kind: "arg", path: "gig_id" }] } },
        { name: "escrow_token_account", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "rent", address: "SysvarRent111111111111111111111111111111111" },
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
        { name: "buyer", writable: true, signer: true },
        { name: "seller", writable: true },
        { name: "escrow_state", writable: true, pda: { seeds: [{ kind: "const", value: [101,115,99,114,111,119] }, { kind: "account", path: "buyer" }, { kind: "account", path: "seller" }, { kind: "account", path: "escrow_state.gig_id" }] } },
        { name: "escrow_token_account", writable: true },
        { name: "seller_token_account", writable: true },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      ],
      args: [],
    },
    {
      name: "resolve_dispute",
      discriminator: [231, 6, 202, 6, 96, 103, 12, 230],
      accounts: [
        { name: "admin", writable: true, signer: true },
        { name: "buyer", writable: true },
        { name: "seller", writable: true },
        { name: "escrow_state", writable: true },
        { name: "escrow_token_account", writable: true },
        { name: "buyer_token_account", writable: true },
        { name: "seller_token_account", writable: true },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
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
          { name: "buyer", type: "pubkey" },
          { name: "seller", type: "pubkey" },
          { name: "mint", type: "pubkey" },
          { name: "escrow_token_account", type: "pubkey" },
          { name: "gig_id", type: "string" },
          { name: "amount", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
} as unknown as Idl;

export function getProgram(wallet: AnchorWallet, connection: Connection) {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program(IDL, provider);
}

export function deriveEscrowPDA(buyerPubkey: PublicKey, sellerPubkey: PublicKey, orderId: string) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      buyerPubkey.toBuffer(),
      sellerPubkey.toBuffer(),
      Buffer.from(orderId),
    ],
    PROGRAM_ID
  );
}

export async function fundEscrow(
  wallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  sellerPubkey: PublicKey,
  amountUsd: number,
) {
  const program = getProgram(wallet, connection);
  const buyer = wallet.publicKey;
  const amount = new BN(Math.round(amountUsd * Math.pow(10, USDC_DECIMALS)));

  const [escrowState] = deriveEscrowPDA(buyer, sellerPubkey, orderId);

  const buyerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, buyer);

  // Rust uses `init` (non-PDA) for escrow_token_account — requires a fresh Keypair signer.
  // The program calls create_account via CPI which requires the new account to sign.
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

  // Build transaction object without sending
  const tx = await program.methods
    .initializeEscrow(orderId, amount)
    .accounts({
      buyer,
      seller: sellerPubkey,
      mint: USDC_MINT,
      buyerTokenAccount,
      escrowState,
      escrowTokenAccount,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .preInstructions(preInstructions)
    .transaction();

  // Attach blockhash and fee payer
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = buyer;

  // Let Phantom sign first — it only sees buyer as signer, no unknown keys yet.
  const signedTx = await wallet.signTransaction(tx);

  // AFTER Phantom has signed, add the escrow token account keypair signature.
  // This avoids the "unknown signer" rejection from Phantom.
  signedTx.partialSign(escrowTokenAccountKeypair);

  // Broadcast
  const txHash = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature: txHash }, "confirmed");

  return txHash;
}

export async function releaseFunds(
  wallet: AnchorWallet,
  connection: Connection,
  orderId: string,
  sellerPubkey: PublicKey,
) {
  const program = getProgram(wallet, connection);
  const buyer = wallet.publicKey;
  const [escrowState] = deriveEscrowPDA(buyer, sellerPubkey, orderId);

  // The escrow token account was a fresh keypair at fund time — stored in EscrowState on chain.
  const state = await (program.account as any).escrowState.fetch(escrowState);
  const escrowTokenAccount = state.escrowTokenAccount as PublicKey;

  const sellerTokenAccount = await getAssociatedTokenAddress(USDC_MINT, sellerPubkey);

  // Create seller's USDC ATA if it doesn't exist yet
  const preInstructions = [];
  const sellerAtaInfo = await connection.getAccountInfo(sellerTokenAccount);
  if (!sellerAtaInfo) {
    preInstructions.push(
      createAssociatedTokenAccountInstruction(buyer, sellerTokenAccount, sellerPubkey, USDC_MINT)
    );
  }

  const tx = await program.methods
    .releaseFunds()
    .accounts({
      buyer,
      seller: sellerPubkey,
      escrowState,
      escrowTokenAccount,
      sellerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preInstructions)
    .rpc();

  return tx;
}
