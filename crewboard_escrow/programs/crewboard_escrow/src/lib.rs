use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod crewboard_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        gig_id: String,
        amount: u64,
    ) -> Result<()> {
        let escrow_state = &mut ctx.accounts.escrow_state;
        escrow_state.buyer = ctx.accounts.buyer.key();
        escrow_state.seller = ctx.accounts.seller.key();
        escrow_state.mint = ctx.accounts.mint.key();
        escrow_state.escrow_token_account = ctx.accounts.escrow_token_account.key();
        escrow_state.gig_id = gig_id;
        escrow_state.amount = amount;
        escrow_state.bump = ctx.bumps.escrow_state; // Use the context bumps

        // Transfer funds from buyer to the escrow PDA token account
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;

        let bump = escrow_state.bump;
        let buyer_key = escrow_state.buyer.key();
        let seller_key = escrow_state.seller.key();
        let gig_id = escrow_state.gig_id.as_bytes();
        let seeds = &[
            b"escrow",
            buyer_key.as_ref(),
            seller_key.as_ref(),
            gig_id,
            &[bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer from escrow PDA to seller
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.escrow_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, escrow_state.amount)?;

        // Close the escrow token account, sending rent back to the buyer
        let cpi_accounts_close = CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.buyer.to_account_info(),
            authority: ctx.accounts.escrow_state.to_account_info(),
        };
        let cpi_program_close = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_close = CpiContext::new_with_signer(cpi_program_close, cpi_accounts_close, signer);
        token::close_account(cpi_ctx_close)?;

        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, route_to_buyer: bool) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;

        let bump = escrow_state.bump;
        let buyer_key = escrow_state.buyer.key();
        let seller_key = escrow_state.seller.key();
        let gig_id = escrow_state.gig_id.as_bytes();
        let seeds = &[
            b"escrow",
            buyer_key.as_ref(),
            seller_key.as_ref(),
            gig_id,
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let destination = if route_to_buyer {
            ctx.accounts.buyer_token_account.to_account_info()
        } else {
            ctx.accounts.seller_token_account.to_account_info()
        };

        // Transfer funds
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: destination,
            authority: ctx.accounts.escrow_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, escrow_state.amount)?;

        // Close the escrow token account
        let cpi_accounts_close = CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.admin.to_account_info(), // admin gets rent for resolving
            authority: ctx.accounts.escrow_state.to_account_info(),
        };
        let cpi_program_close = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_close = CpiContext::new_with_signer(cpi_program_close, cpi_accounts_close, signer);
        token::close_account(cpi_ctx_close)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(gig_id: String)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Safe because we only store the pubkey
    pub seller: AccountInfo<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == mint.key()
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = buyer,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), gig_id.as_bytes()],
        bump,
        space = 8 + 32 + 32 + 32 + 32 + 4 + gig_id.len() + 8 + 1
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(
        init,
        payer = buyer,
        token::mint = mint,
        token::authority = escrow_state,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Checked via seeds
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        has_one = buyer,
        has_one = seller,
        has_one = escrow_token_account,
        close = buyer, // Close escrow_state account and return rent to buyer
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), escrow_state.gig_id.as_bytes()],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == escrow_state.mint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    // In a real production app, this would be validated against a config account
    // or a hardcoded pubkey to ensure only the true admin can resolve.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: Checked via seeds
    #[account(mut)]
    pub buyer: AccountInfo<'info>,

    /// CHECK: Checked via seeds
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        has_one = buyer,
        has_one = seller,
        has_one = escrow_token_account,
        close = admin, // close state and send rent to admin as fee
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), escrow_state.gig_id.as_bytes()],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = buyer_token_account.owner == buyer.key(),
        constraint = buyer_token_account.mint == escrow_state.mint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == escrow_state.mint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct EscrowState {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub escrow_token_account: Pubkey,
    pub gig_id: String,
    pub amount: u64,
    pub bump: u8,
}
