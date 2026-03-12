import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { assert } from "chai";

// This would be the generated types if anchor build was run
// import { CrewboardEscrow } from "../target/types/crewboard_escrow";

describe("crewboard_escrow", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // We are bypassing the type checking here since we haven't built the IDL yet
  // In a real environment, you'd use anchor.workspace.CrewboardEscrow as Program<CrewboardEscrow>
  const program = anchor.workspace.CrewboardEscrow as any;

  let mint: PublicKey;
  let buyerTokenAccount: PublicKey;
  let sellerTokenAccount: PublicKey;
  let adminTokenAccount: PublicKey;

  const buyer = Keypair.generate();
  const seller = Keypair.generate();
  const admin = Keypair.generate();
  
  const gigId = "gig_12345";
  const escrowAmount = new anchor.BN(100_000_000); // 100 USDC (assuming 6 decimals)

  let escrowStatePda: PublicKey;
  let escrowTokenAccountPda: PublicKey;
  let bump: number;

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropSig1 = await provider.connection.requestAirdrop(buyer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const airdropSig2 = await provider.connection.requestAirdrop(admin.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropSig1);
    await provider.connection.confirmTransaction(airdropSig2);

    // Create a mock USDC Mint
    mint = await createMint(
      provider.connection,
      buyer, // payer
      admin.publicKey, // mint authority
      null, // freeze authority
      6 // decimals
    );

    // Create Token Accounts
    buyerTokenAccount = await createAccount(provider.connection, buyer, mint, buyer.publicKey);
    sellerTokenAccount = await createAccount(provider.connection, buyer, mint, seller.publicKey);
    adminTokenAccount = await createAccount(provider.connection, admin, mint, admin.publicKey);

    // Mint some "USDC" to the buyer
    await mintTo(provider.connection, buyer, mint, buyerTokenAccount, admin.publicKey, 500_000_000, [admin]);

    // Find PDAs
    [escrowStatePda, bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        buyer.publicKey.toBuffer(),
        seller.publicKey.toBuffer(),
        Buffer.from(gigId)
      ],
      program.programId
    );

    escrowTokenAccountPda = anchor.utils.token.associatedAddress({
      mint: mint,
      owner: escrowStatePda
    });
  });

  it("Initializes the escrow and locks funds", async () => {
    const tx = await program.methods
      .initializeEscrow(gigId, escrowAmount)
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        mint: mint,
        buyerTokenAccount: buyerTokenAccount,
        escrowState: escrowStatePda,
        escrowTokenAccount: escrowTokenAccountPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([buyer])
      .rpc();

    console.log("Initialize Escrow Tx:", tx);

    // Verify state
    const state = await program.account.escrowState.fetch(escrowStatePda);
    assert.equal(state.buyer.toBase58(), buyer.publicKey.toBase58());
    assert.equal(state.seller.toBase58(), seller.publicKey.toBase58());
    assert.equal(state.amount.toString(), escrowAmount.toString());

    // Verify token transfer
    const escrowTokenAcc = await getAccount(provider.connection, escrowTokenAccountPda);
    assert.equal(escrowTokenAcc.amount.toString(), escrowAmount.toString());
  });

  it("Releases funds to the seller", async () => {
    const tx = await program.methods
      .releaseFunds()
      .accounts({
        buyer: buyer.publicKey,
        seller: seller.publicKey,
        escrowState: escrowStatePda,
        escrowTokenAccount: escrowTokenAccountPda,
        sellerTokenAccount: sellerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    console.log("Release Funds Tx:", tx);

    // Verify token transfer to seller
    const sellerTokenAcc = await getAccount(provider.connection, sellerTokenAccount);
    assert.equal(sellerTokenAcc.amount.toString(), escrowAmount.toString());

    // Verify escrow state is closed
    try {
      await program.account.escrowState.fetch(escrowStatePda);
      assert.fail("Escrow state should have been closed");
    } catch (e: any) {
      assert.include(e.message, "Account does not exist");
    }
  });
});
