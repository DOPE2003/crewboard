use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("9tVjarHacBHFbxRoHxDeR8afbfPa5Z25Q5ZmUWGo8vXp");

// ─── Constants ───────────────────────────────────────────────────────────────

/// Platform fee: 10 % (1000 / 10000).
pub const FEE_BPS: u64 = 1_000;
pub const BPS_DENOMINATOR: u64 = 10_000;

/// 14 days in seconds — AFK timeout for both buyer and seller.
pub const AFK_TIMEOUT_SECS: i64 = 14 * 24 * 60 * 60;

/// Admin wallet — the ONLY signer allowed to call admin_force_release / admin_refund.
/// Run `solana address` to get your local keypair pubkey, then paste it here.
/// TODO: replace with your actual admin wallet before mainnet deploy.
pub const ADMIN_PUBKEY: Pubkey = pubkey!("BiBgkrFA72AAhQVZmxVAU9MDnWpg2nKdbrwa9M5pNN2a");

/// Platform treasury wallet — receives 10 % on every release.
/// Matches TREASURY_WALLET in lib/escrow.ts.
pub const TREASURY_PUBKEY: Pubkey = pubkey!("Fn95Cx5iUhwVTUB6ZL3B8CmBYpbFYB2MSepa1xdeT68q");

/// Mainnet USDC mint (Circle). Enforced on-chain — prevents funding with any other token.
pub const USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod crewboard_escrow {
    use super::*;

    /// Lock buyer's USDC into escrow.
    /// Creates a PDA-owned ATA as the escrow vault — deterministic, no extra keypair.
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        gig_id: String,
        amount: u64,
    ) -> Result<()> {
        require!(gig_id.len() <= 64, EscrowError::GigIdTooLong);
        require!(amount > 0, EscrowError::ZeroAmount);
        require!(
            ctx.accounts.buyer.key() != ctx.accounts.seller.key(),
            EscrowError::BuyerIsSeller
        );

        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.escrow_state;

        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.mint = ctx.accounts.mint.key();
        escrow.escrow_token_account = ctx.accounts.escrow_token_account.key();
        escrow.gig_id = gig_id;
        escrow.amount = amount;
        escrow.bump = ctx.bumps.escrow_state;
        escrow.created_at = clock.unix_timestamp;
        escrow.delivered_at = 0;
        escrow.is_delivered = false;

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

    /// Seller marks the gig as delivered.
    /// Starts the 14-day AFK clock for the buyer.
    pub fn mark_delivered(ctx: Context<MarkDelivered>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;

        require!(!escrow.is_delivered, EscrowError::AlreadyDelivered);

        let clock = Clock::get()?;
        escrow.is_delivered = true;
        escrow.delivered_at = clock.unix_timestamp;

        Ok(())
    }

    /// Buyer approves delivery and releases funds.
    /// 90 % → seller ATA, 10 % → treasury ATA.
    /// Closes escrow_token_account and escrow_state — returns rent to buyer.
    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_state;

        require!(escrow.is_delivered, EscrowError::NotDelivered);

        let total = escrow.amount;

        let fee_amount = total
            .checked_mul(FEE_BPS)
            .ok_or(EscrowError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(EscrowError::Overflow)?;
        let seller_amount = total.checked_sub(fee_amount).ok_or(EscrowError::Overflow)?;

        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            escrow.gig_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // 90 % → seller
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

        // 10 % → treasury
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

        // Close the vault — return rent lamports to buyer
        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.escrow_token_account.to_account_info(),
                    destination: ctx.accounts.buyer.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer_seeds,
            ),
        )?;

        Ok(())
    }

    /// Admin forces fund release when buyer goes AFK.
    /// Conditions: is_delivered == true AND now > delivered_at + 14 days.
    /// Same split: 90 % → seller, 10 % → treasury.
    pub fn admin_force_release(ctx: Context<AdminForceRelease>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_state;
        let clock = Clock::get()?;

        require!(escrow.is_delivered, EscrowError::NotDelivered);
        require!(
            clock.unix_timestamp > escrow.delivered_at + AFK_TIMEOUT_SECS,
            EscrowError::TooEarly
        );

        let total = escrow.amount;
        let fee_amount = total
            .checked_mul(FEE_BPS)
            .ok_or(EscrowError::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(EscrowError::Overflow)?;
        let seller_amount = total.checked_sub(fee_amount).ok_or(EscrowError::Overflow)?;

        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            escrow.gig_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

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

        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.escrow_token_account.to_account_info(),
                    destination: ctx.accounts.buyer.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer_seeds,
            ),
        )?;

        Ok(())
    }

    /// Admin resolves a dispute — can run at any time, no waiting period.
    /// route_to_buyer = true  → full refund to buyer (no fee — seller-fault).
    /// route_to_buyer = false → 90 % to seller, 10 % to treasury (buyer-fault).
    pub fn resolve_dispute(ctx: Context<ResolveDispute>, route_to_buyer: bool) -> Result<()> {
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
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to:   ctx.accounts.buyer_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_state.to_account_info(),
                    },
                    signer_seeds,
                ),
                total,
            )?;
        } else {
            let fee_amount    = total.checked_mul(FEE_BPS).ok_or(EscrowError::Overflow)?.checked_div(BPS_DENOMINATOR).ok_or(EscrowError::Overflow)?;
            let seller_amount = total.checked_sub(fee_amount).ok_or(EscrowError::Overflow)?;

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to:   ctx.accounts.seller_token_account.to_account_info(),
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
                        to:   ctx.accounts.treasury_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_state.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee_amount,
            )?;
        }

        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account:     ctx.accounts.escrow_token_account.to_account_info(),
                    destination: ctx.accounts.buyer.to_account_info(),
                    authority:   ctx.accounts.escrow_state.to_account_info(),
                },
                signer_seeds,
            ),
        )?;

        Ok(())
    }

    /// Admin refunds the buyer when seller goes AFK (never delivers).
    /// Conditions: is_delivered == false AND now > created_at + 14 days.
    /// Full refund — no platform fee on seller-fault refunds.
    pub fn admin_refund(ctx: Context<AdminRefund>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_state;
        let clock = Clock::get()?;

        require!(!escrow.is_delivered, EscrowError::AlreadyDelivered);
        require!(
            clock.unix_timestamp > escrow.created_at + AFK_TIMEOUT_SECS,
            EscrowError::TooEarly
        );

        let total = escrow.amount;

        let seeds = &[
            b"escrow",
            escrow.buyer.as_ref(),
            escrow.seller.as_ref(),
            escrow.gig_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Full refund — no fee when seller is at fault
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

        token::close_account(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.escrow_token_account.to_account_info(),
                    destination: ctx.accounts.buyer.to_account_info(),
                    authority: ctx.accounts.escrow_state.to_account_info(),
                },
                signer_seeds,
            ),
        )?;

        Ok(())
    }
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(gig_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller is a recipient — not a signer at init time
    pub seller: AccountInfo<'info>,

    /// Must be the USDC mint — prevents funding with arbitrary tokens
    #[account(address = USDC_MINT @ EscrowError::InvalidMint)]
    pub mint: Account<'info, Mint>,

    /// Buyer's USDC ATA — source of funds
    #[account(
        mut,
        token::mint = mint,
        token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// PDA storing escrow metadata. Seeds: ["escrow", buyer, seller, gig_id]
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

    /// ATA owned by escrow_state PDA — vault for locked tokens.
    /// Created by client via createAssociatedTokenAccountIdempotent pre-instruction
    /// to avoid Phantom simulation false-positive revert.
    #[account(
        mut,
        token::mint = mint,
        token::authority = escrow_state,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MarkDelivered<'info> {
    /// Only the seller can mark delivery
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_state.buyer.as_ref(),
            escrow_state.seller.as_ref(),
            escrow_state.gig_id.as_bytes(),
        ],
        bump = escrow_state.bump,
        has_one = seller @ EscrowError::Unauthorized,
    )]
    pub escrow_state: Account<'info, EscrowState>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    /// Only the buyer can release funds voluntarily
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: seller receives funds — validated by has_one
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
        has_one = buyer  @ EscrowError::Unauthorized,
        has_one = seller @ EscrowError::Unauthorized,
        close = buyer,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    /// Vault ATA — address and mint both validated for defense-in-depth
    #[account(
        mut,
        address = escrow_state.escrow_token_account @ EscrowError::Unauthorized,
        token::mint = escrow_state.mint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Seller's ATA — receives 90 %
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    /// CHECK: validated against TREASURY_PUBKEY constant
    #[account(address = TREASURY_PUBKEY @ EscrowError::Unauthorized)]
    pub treasury: AccountInfo<'info>,

    /// Treasury ATA — receives 10 %
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = treasury,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminForceRelease<'info> {
    /// Must be ADMIN_PUBKEY — address constraint enforces this
    #[account(
        mut,
        address = ADMIN_PUBKEY @ EscrowError::Unauthorized,
    )]
    pub admin: Signer<'info>,

    /// CHECK: buyer receives rent from closed escrow_state
    #[account(mut)]
    pub buyer: AccountInfo<'info>,

    /// CHECK: seller receives funds — validated by has_one
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
        has_one = buyer  @ EscrowError::Unauthorized,
        has_one = seller @ EscrowError::Unauthorized,
        close = buyer,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(
        mut,
        address = escrow_state.escrow_token_account @ EscrowError::Unauthorized,
        token::mint = escrow_state.mint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Seller's ATA — receives 90 %
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    /// CHECK: validated against TREASURY_PUBKEY constant
    #[account(address = TREASURY_PUBKEY @ EscrowError::Unauthorized)]
    pub treasury: AccountInfo<'info>,

    /// Treasury ATA — receives 10 %
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = treasury,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        address = ADMIN_PUBKEY @ EscrowError::Unauthorized,
    )]
    pub admin: Signer<'info>,

    /// CHECK: buyer receives refund and/or rent
    #[account(mut)]
    pub buyer: AccountInfo<'info>,

    /// CHECK: seller receives funds in non-refund path
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
        has_one = buyer  @ EscrowError::Unauthorized,
        has_one = seller @ EscrowError::Unauthorized,
        close = buyer,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(
        mut,
        address = escrow_state.escrow_token_account @ EscrowError::Unauthorized,
        token::mint = escrow_state.mint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Buyer's ATA — receives full refund when route_to_buyer = true
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// Seller's ATA — receives 90 % when route_to_buyer = false
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = seller,
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    /// CHECK: validated against TREASURY_PUBKEY constant
    #[account(address = TREASURY_PUBKEY @ EscrowError::Unauthorized)]
    pub treasury: AccountInfo<'info>,

    /// Treasury ATA — receives 10 % when route_to_buyer = false
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = treasury,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminRefund<'info> {
    /// Must be ADMIN_PUBKEY — address constraint enforces this
    #[account(
        mut,
        address = ADMIN_PUBKEY @ EscrowError::Unauthorized,
    )]
    pub admin: Signer<'info>,

    /// CHECK: buyer receives refund and rent — validated by has_one
    #[account(mut)]
    pub buyer: AccountInfo<'info>,

    /// CHECK: seller is needed for PDA seed reconstruction — validated by has_one
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
        has_one = buyer  @ EscrowError::Unauthorized,
        has_one = seller @ EscrowError::Unauthorized,
        close = buyer,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(
        mut,
        address = escrow_state.escrow_token_account @ EscrowError::Unauthorized,
        token::mint = escrow_state.mint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Buyer's ATA — receives full refund
    #[account(
        mut,
        token::mint = escrow_state.mint,
        token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct EscrowState {
    pub buyer: Pubkey,                 // 32
    pub seller: Pubkey,                // 32
    pub mint: Pubkey,                  // 32
    pub escrow_token_account: Pubkey,  // 32
    pub gig_id: String,                // 4 + max 64
    pub amount: u64,                   // 8
    pub bump: u8,                      // 1
    pub created_at: i64,               // 8
    pub delivered_at: i64,             // 8
    pub is_delivered: bool,            // 1
}

impl EscrowState {
    pub const LEN: usize = 8      // discriminator
        + 32 + 32 + 32 + 32       // buyer, seller, mint, escrow_token_account
        + (4 + 64)                // gig_id (String prefix + max 64 bytes)
        + 8                       // amount
        + 1                       // bump
        + 8                       // created_at
        + 8                       // delivered_at
        + 1;                      // is_delivered
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("Action not yet permitted — the required time period has not elapsed")]
    TooEarly,
    #[msg("Work has not been marked as delivered by the seller yet")]
    NotDelivered,
    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,
    #[msg("Work has already been marked as delivered")]
    AlreadyDelivered,
    #[msg("gig_id exceeds maximum length of 64 bytes")]
    GigIdTooLong,
    #[msg("Token mint must be USDC")]
    InvalidMint,
    #[msg("Escrow amount must be greater than zero")]
    ZeroAmount,
    #[msg("Buyer and seller must be different accounts")]
    BuyerIsSeller,
    #[msg("Arithmetic overflow")]
    Overflow,
}
