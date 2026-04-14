import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: The constants ADMIN_PUBKEY and TREASURY_PUBKEY in lib.rs MUST
// match the pubkeys used in this test file.
//
// For local testing, we use the provider's wallet as both admin and treasury
// and set the constants in lib.rs to that wallet's address.
//
// Run: solana address  (to find your local wallet pubkey)
// Then update ADMIN_PUBKEY and TREASURY_PUBKEY in lib.rs before anchor build.
// ─────────────────────────────────────────────────────────────────────────────

describe("crewboard_escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.CrewboardEscrow as any;

  // In local tests, the provider wallet acts as admin AND treasury.
  // Its pubkey must match ADMIN_PUBKEY and TREASURY_PUBKEY in lib.rs.
  const adminWallet = (provider.wallet as anchor.Wallet).payer;

  const buyer  = Keypair.generate();
  const seller = Keypair.generate();

  const gigId        = "gig_12345";
  const escrowAmount = new anchor.BN(100_000_000); // 100 USDC (6 decimals)

  let mint:                  PublicKey;
  let buyerTokenAccount:     PublicKey;
  let sellerTokenAccount:    PublicKey;
  let treasuryTokenAccount:  PublicKey;
  let escrowStatePda:        PublicKey;
  let escrowTokenAccountPda: PublicKey;

  // ── Setup ──────────────────────────────────────────────────────────────────
  before(async () => {
    // Airdrop SOL to buyer and seller
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(buyer.publicKey, 2e9)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(seller.publicKey, 1e9)
    );

    // Create a mock USDC mint (mint authority = adminWallet)
    mint = await createMint(
      provider.connection,
      adminWallet,
      adminWallet.publicKey,
      null,
      6
    );

    // Create ATAs
    buyerTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection, buyer, mint, buyer.publicKey
      )
    ).address;

    sellerTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection, buyer, mint, seller.publicKey
      )
    ).address;

    // Treasury ATA — owned by adminWallet (must match TREASURY_PUBKEY in lib.rs)
    treasuryTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection, adminWallet, mint, adminWallet.publicKey
      )
    ).address;

    // Fund buyer with 500 USDC
    await mintTo(
      provider.connection,
      adminWallet,
      mint,
      buyerTokenAccount,
      adminWallet,
      500_000_000,
      []
    );

    // Derive PDA
    [escrowStatePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        seller.publicKey.toBuffer(),
        Buffer.from(gigId),
      ],
      program.programId
    );

    // Escrow vault = ATA owned by escrow_state PDA (matches Rust init constraint)
    escrowTokenAccountPda = anchor.utils.token.associatedAddress({
      mint,
      owner: escrowStatePda,
    });
  });

  // ── Test 1: Initialize ─────────────────────────────────────────────────────
  it("Initializes escrow and locks funds", async () => {
    const tx = await program.methods
      .initializeEscrow(gigId, escrowAmount)
      .accounts({
        buyer:                 buyer.publicKey,
        seller:                seller.publicKey,
        mint,
        buyerTokenAccount,
        escrowState:           escrowStatePda,
        escrowTokenAccount:    escrowTokenAccountPda,
        systemProgram:         SystemProgram.programId,
        tokenProgram:          TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("initializeEscrow tx:", tx);

    const state = await program.account.escrowState.fetch(escrowStatePda);
    assert.equal(state.buyer.toBase58(),  buyer.publicKey.toBase58());
    assert.equal(state.seller.toBase58(), seller.publicKey.toBase58());
    assert.equal(state.amount.toString(), escrowAmount.toString());
    assert.equal(state.isDelivered, false);
    assert.isAbove(state.createdAt.toNumber(), 0, "createdAt must be set");

    const vault = await getAccount(provider.connection, escrowTokenAccountPda);
    assert.equal(vault.amount.toString(), escrowAmount.toString(), "vault holds full amount");
  });

  // ── Test 2: Mark Delivered ─────────────────────────────────────────────────
  it("Seller marks gig as delivered", async () => {
    const tx = await program.methods
      .markDelivered()
      .accounts({
        seller:      seller.publicKey,
        escrowState: escrowStatePda,
      })
      .signers([seller])
      .rpc();

    console.log("markDelivered tx:", tx);

    const state = await program.account.escrowState.fetch(escrowStatePda);
    assert.equal(state.isDelivered, true, "isDelivered should be true");
    assert.isAbove(state.deliveredAt.toNumber(), 0, "deliveredAt must be set");
  });

  // ── Test 3: Prevent double delivery ────────────────────────────────────────
  it("Rejects double mark_delivered", async () => {
    try {
      await program.methods
        .markDelivered()
        .accounts({
          seller:      seller.publicKey,
          escrowState: escrowStatePda,
        })
        .signers([seller])
        .rpc();
      assert.fail("Should have rejected duplicate mark_delivered");
    } catch (e: any) {
      assert.include(e.message, "AlreadyDelivered");
    }
  });

  // ── Test 4: Release Funds ──────────────────────────────────────────────────
  it("Buyer releases funds — 90% to seller, 10% to treasury", async () => {
    const tx = await program.methods
      .releaseFunds()
      .accounts({
        buyer:                buyer.publicKey,
        seller:               seller.publicKey,
        escrowState:          escrowStatePda,
        escrowTokenAccount:   escrowTokenAccountPda,
        sellerTokenAccount,
        // treasury must match TREASURY_PUBKEY in lib.rs (adminWallet in tests)
        treasury:             adminWallet.publicKey,
        treasuryTokenAccount,
        tokenProgram:         TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("releaseFunds tx:", tx);

    const sellerAcc   = await getAccount(provider.connection, sellerTokenAccount);
    const treasuryAcc = await getAccount(provider.connection, treasuryTokenAccount);

    assert.equal(
      sellerAcc.amount.toString(),
      "90000000",
      "Seller should receive 90 USDC"
    );
    assert.equal(
      treasuryAcc.amount.toString(),
      "10000000",
      "Treasury should receive 10 USDC"
    );

    // escrow_state account should be closed
    try {
      await program.account.escrowState.fetch(escrowStatePda);
      assert.fail("escrow_state should have been closed");
    } catch (e: any) {
      assert.include(e.message, "Account does not exist");
    }
  });

  // ── Test 5: admin_force_release (requires warp / timestamp override) ───────
  // NOTE: This test is intentionally skipped in normal runs because it
  // requires the clock to be warped past delivered_at + 14 days.
  //
  // To test locally:
  //   1. Set AFK_TIMEOUT_SECS to a small value (e.g., 1) in lib.rs
  //   2. Re-run this suite with a fresh escrow + sleep(2000) before this call
  //   OR use: solana-test-validator --warp-slot <slot>
  it.skip("Admin force-releases funds after AFK timeout (requires time warp)", async () => {
    // Re-initialize a second escrow for this test
    const gigId2 = "gig_afk_test";
    const [escrow2Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        seller.publicKey.toBuffer(),
        Buffer.from(gigId2),
      ],
      program.programId
    );
    const escrowTokenAccount2 = anchor.utils.token.associatedAddress({
      mint,
      owner: escrow2Pda,
    });

    await program.methods
      .initializeEscrow(gigId2, escrowAmount)
      .accounts({
        buyer:                 buyer.publicKey,
        seller:                seller.publicKey,
        mint,
        buyerTokenAccount,
        escrowState:           escrow2Pda,
        escrowTokenAccount:    escrowTokenAccount2,
        systemProgram:         SystemProgram.programId,
        tokenProgram:          TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    await program.methods.markDelivered()
      .accounts({ seller: seller.publicKey, escrowState: escrow2Pda })
      .signers([seller])
      .rpc();

    // <-- warp clock here in your test environment --

    await program.methods
      .adminForceRelease()
      .accounts({
        admin:               adminWallet.publicKey,
        buyer:               buyer.publicKey,
        seller:              seller.publicKey,
        escrowState:         escrow2Pda,
        escrowTokenAccount:  escrowTokenAccount2,
        sellerTokenAccount,
        treasury:            adminWallet.publicKey,
        treasuryTokenAccount,
        tokenProgram:        TOKEN_PROGRAM_ID,
      })
      .signers([adminWallet])
      .rpc();
  });

  // ── Test 6: admin_refund (requires warp / timestamp override) ─────────────
  it.skip("Admin refunds buyer after seller AFK timeout (requires time warp)", async () => {
    const gigId3 = "gig_seller_afk";
    const [escrow3Pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        seller.publicKey.toBuffer(),
        Buffer.from(gigId3),
      ],
      program.programId
    );
    const escrowTokenAccount3 = anchor.utils.token.associatedAddress({
      mint,
      owner: escrow3Pda,
    });

    await program.methods
      .initializeEscrow(gigId3, escrowAmount)
      .accounts({
        buyer:                 buyer.publicKey,
        seller:                seller.publicKey,
        mint,
        buyerTokenAccount,
        escrowState:           escrow3Pda,
        escrowTokenAccount:    escrowTokenAccount3,
        systemProgram:         SystemProgram.programId,
        tokenProgram:          TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    // Seller never marks delivered — <-- warp clock past created_at + 14 days

    await program.methods
      .adminRefund()
      .accounts({
        admin:              adminWallet.publicKey,
        buyer:              buyer.publicKey,
        seller:             seller.publicKey,
        escrowState:        escrow3Pda,
        escrowTokenAccount: escrowTokenAccount3,
        buyerTokenAccount,
        tokenProgram:       TOKEN_PROGRAM_ID,
      })
      .signers([adminWallet])
      .rpc();

    const buyerAcc = await getAccount(provider.connection, buyerTokenAccount);
    // Buyer should have been fully refunded (check relative to starting balance)
    assert.isAbove(Number(buyerAcc.amount), 0);
  });
});
