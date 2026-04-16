/**
 * POST /api/mobile/escrow/build-fund
 *
 * Builds an UNSIGNED initialize_escrow Solana transaction and returns it
 * as a base64 string.  The iOS client:
 *   1. Deserialises with `Transaction.from(Buffer.from(tx, 'base64'))`
 *   2. Signs with the buyer's Solana wallet
 *   3. Submits to the RPC
 *   4. On confirmation, POSTs the txHash to /api/mobile/escrow/sync-funded
 *
 * Auth:   Bearer <mobile JWT>  (buyer must be the authenticated user)
 * Role:   buyer only
 *
 * Body:
 * {
 *   orderId:      string   // Crewboard order id
 * }
 *
 * 200:
 * {
 *   data: {
 *     tx:            string   // base64 unsigned transaction — sign + submit on iOS
 *     escrowAddress: string   // escrow PDA (store this; needed for sync-funded)
 *     blockhashExpiry: number // approx Unix seconds after which blockhash expires (~60s)
 *   }
 * }
 */
import { NextRequest } from "next/server";
import { PublicKey }   from "@solana/web3.js";
import db              from "@/lib/db";
import { buildFundTx } from "@/lib/escrow-build";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";

async function handler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body    = await req.json().catch(() => ({}));
    const { orderId } = body as { orderId?: string };

    if (!orderId) return err("orderId is required.");

    // Load order + wallet addresses from DB
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, status: true, amount: true,
        buyerId:  true,
        sellerId: true,
        buyer:  { select: { walletAddress: true } },
        seller: { select: { walletAddress: true } },
      },
    });

    if (!order)                         return err("Order not found.", 404);
    if (order.buyerId !== user.sub)     return err("Only the buyer can fund escrow.", 403);
    if (order.status !== "pending")     return err(`Order is ${order.status}, expected pending.`);
    if (!order.buyer.walletAddress)     return err("Your wallet is not linked. Connect a Solana wallet first.");
    if (!order.seller.walletAddress)    return err("Seller has no wallet address on file.");

    const buyerPubkey  = new PublicKey(order.buyer.walletAddress);
    const sellerPubkey = new PublicKey(order.seller.walletAddress);

    const { tx, escrowAddress } = await buildFundTx(
      buyerPubkey, sellerPubkey, orderId, order.amount,
    );

    return ok({
      tx,
      escrowAddress,
      // Blockhash expires in ~150 slots ≈ 60 seconds — sign fast
      blockhashExpiry: Math.floor(Date.now() / 1000) + 60,
    });
  } catch (e) {
    console.error("[mobile/escrow/build-fund]", e);
    return err("Failed to build transaction.", 500);
  }
}

export const POST = withMobileAuth(handler);
