use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp");

/// Platform fee rate: 10% deducted from seller payout at release.
/// Client pays full price; seller receives 90%.
pub const FEE_BPS: u64 = 1_000; // 1000 / 10000 = 10%
pub const BPS_DENOMINATOR: u64 = 10_000;

#[program]
pub mod crewboard_escrow {
    use super::*;

    /// Lock buyer's USDC into escrow.
    /// Buyer pays the full gig price; no extra fee at this stage.
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        gig_id: String,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.mint = ctx.accounts.mint.key();
        escrow.escrow_token_account = ctx.accounts.escrow_token_account.key();
        escrow.gig_id = gig_id;
        escrow.amount = amount;
        escrow.bump = ctx.bumps.escrow_state;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_token_account.to_account_info(),
                    to: ctx.accounts.escrow_token_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    /// Release escrow to seller (buyer approves delivery).
    /// Splits payout: 90% → seller, 10% → treasury.
    /// Uses integer arithmetic to avoid floating-point errors.
    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_state;
        let total = escrow.amount;

        // Fee = floor(total * FEE_BPS / BPS_DENOMINATOR)
        // Seller receives the remainder — avoids rounding dust in escrow
        let fee_amount = total
            .checked_mul(FEE_BPS)
            .unwrap()
            .checked_div(BPS_DENOMINATOR)
            .unwrap();
        let seller_amount = total.checked_sub(fee_amount).unwrap();

        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            escrow.gig_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // 90% → seller
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer_seeds,
            ),
            seller_amount,
        )?;

        // 10% → treasury
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer_seeds,
            ),
            fee_amount,
        )?;

        Ok(())
    }

    /// Admin-only dispute resolution.
    /// route_to_buyer=true  → 100% refund to buyer (no fee on refunds).
    /// route_to_buyer=false → 90% to seller, 10% to treasury.
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        route_to_buyer: bool,
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow_state;
        let total = escrow.amount;

        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            escrow.gig_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        if route_to_buyer {
            // Full refund — no platform fee on buyer refunds
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.buyer_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_state.to_account_info(),
                    },
                    signer_seeds,
                ),
                total,
            )?;
        } else {
            // Seller wins: apply same 10% fee as normal release
            let fee_amount = total
                .checked_mul(FEE_BPS)
                .unwrap()
                .checked_div(BPS_DENOMINATOR)
                .unwrap();
            let seller_amount = total.checked_sub(fee_amount).unwrap();

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.seller_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_state.to_account_info(),
                    },
                    signer_seeds,
                ),
                seller_amount,
            )?;

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.treasury_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_state.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee_amount,
            )?;
        }

        Ok(())
    }
}

// ─── Account Structs ────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(gig_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: seller is a recipient only
    pub seller: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = buyer,
        space = EscrowState::LEN,
        seeds = [
            b"escrow",
            buyer.key().as_ref(),
            seller.key().as_ref(),
            gig_id.as_bytes(),
        ],
        bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    /// Fresh keypair account created by the buyer — stores escrowed tokens.
    /// Address saved in EscrowState.escrow_token_account for later retrieval.
    #[account(mut)]
    pub escrow_token_account: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: seller receives funds
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_state.buyer.as_ref(),
            escrow_state.seller.as_ref(),
            escrow_state.gig_id.as_bytes(),
        ],
        bump = escrow_state.bump,
        close = buyer,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    /// Token account holding the locked USDC (address stored in EscrowState).
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    /// Seller's USDC ATA — receives 90%.
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    /// Treasury USDC ATA — receives 10% platform fee.
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: buyer may receive refund
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    /// CHECK: seller may receive payout
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_state.buyer.as_ref(),
            escrow_state.seller.as_ref(),
            escrow_state.gig_id.as_bytes(),
        ],
        bump = escrow_state.bump,
        close = admin,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    /// Treasury USDC ATA — receives 10% fee when seller wins dispute.
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

// ─── State ──────────────────────────────────────────────────────────────────

#[account]
pub struct EscrowState {
    pub buyer: Pubkey,               // 32
    pub seller: Pubkey,              // 32
    pub mint: Pubkey,                // 32
    pub escrow_token_account: Pubkey,// 32
    pub gig_id: String,              // 4 + max 64
    pub amount: u64,                 // 8
    pub bump: u8,                    // 1
}

impl EscrowState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + (4 + 64) + 8 + 1;
}
