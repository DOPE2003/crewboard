/**
 * POST /api/mobile/wallet/link
 *
 * Saves (or replaces) the authenticated user's Solana wallet address in the DB.
 * Call this immediately after the user connects their Phantom / wallet adapter
 * in the iOS app, before attempting any escrow transaction.
 *
 * Auth:  Bearer <mobile JWT>
 *
 * Body:
 * {
 *   walletAddress: string   // base58 Solana public key
 * }
 *
 * 200:  { data: { walletAddress: string } }
 * 400:  { error: "walletAddress is required." }
 * 409:  { error: "Wallet already linked to another account." }
 */
import { NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { walletAddress } = body as { walletAddress?: string };

    if (!walletAddress) return err("walletAddress is required.");

    // Validate it's a real Solana public key
    try { new PublicKey(walletAddress); } catch {
      return err("Invalid Solana wallet address.");
    }

    // Check uniqueness — another user might already have this wallet
    const existing = await db.user.findUnique({
      where: { walletAddress },
      select: { id: true },
    });
    if (existing && existing.id !== user.sub) {
      return err("Wallet already linked to another account.", 409);
    }

    await db.user.update({
      where: { id: user.sub },
      data: { walletAddress },
    });

    return ok({ walletAddress });
  } catch (e) {
    console.error("[mobile/wallet/link]", e);
    return err("Failed to link wallet.", 500);
  }
}

export const POST = withMobileAuth(handler);
