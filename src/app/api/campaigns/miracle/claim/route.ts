/**
 * POST /api/campaigns/miracle/claim
 *
 * Auth: Bearer <mobile JWT>. Creates a pending campaign claim for
 * miracle-de-2026. Cap is atomically enforced at 50 within a DB transaction.
 *
 * Body: { campaign?, walletAddress, signature, nonce }
 *
 * Errors:
 *   400 cap_reached       — 50 claims already
 *   400 not_eligible      — wallet failed eligibility re-check
 *   400 already_claimed   — wallet has a non-expired claim
 *   401 signature_invalid — ed25519 sig does not verify
 *   401                   — no valid auth
 */
import { NextRequest } from "next/server";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
import db from "@/lib/db";
import { checkWalletEligibility } from "@/lib/helius";
import { withMobileAuth, MobileTokenPayload } from "@/app/api/mobile/_lib/auth";

const CAMPAIGN_ID = "miracle-de-2026";
const CAP = 50;
const CLAIM_TTL_DAYS = 14;

function verifySignature(walletAddress: string, nonce: string, signature: string): boolean {
  try {
    const message = `claim-${CAMPAIGN_ID}:${walletAddress}:${nonce}`;
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = bs58.decode(signature);
    const pubkeyBytes = bs58.decode(walletAddress);
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
  } catch {
    return false;
  }
}

async function handler(req: NextRequest, user: MobileTokenPayload) {
  const body = await req.json().catch(() => ({})) as {
    campaign?: string;
    walletAddress?: string;
    signature?: string;
    nonce?: string;
  };

  const { campaign, walletAddress, signature, nonce } = body;

  if (!walletAddress) return Response.json({ error: "walletAddress is required" }, { status: 400 });
  if (!signature)     return Response.json({ error: "signature is required" }, { status: 400 });
  if (!nonce)         return Response.json({ error: "nonce is required" }, { status: 400 });
  if (campaign && campaign !== CAMPAIGN_ID) {
    return Response.json({ error: "Unknown campaign." }, { status: 400 });
  }

  if (!verifySignature(walletAddress, nonce, signature)) {
    return Response.json({ error: "Invalid signature.", code: "signature_invalid" }, { status: 401 });
  }

  const eligibility = await checkWalletEligibility(walletAddress);
  if (!eligibility.eligible) {
    return Response.json({ error: "Wallet does not meet eligibility requirements.", code: "not_eligible" }, { status: 400 });
  }

  const existing = await db.campaignClaim.findFirst({
    where: {
      campaign: CAMPAIGN_ID,
      walletAddress,
      status: { in: ["pending", "qualified", "redeemed"] },
    },
  });
  if (existing) {
    return Response.json({ error: "This wallet has already claimed.", code: "already_claimed" }, { status: 400 });
  }

  try {
    const claim = await db.$transaction(async (tx) => {
      const count = await tx.campaignClaim.count({
        where: { campaign: CAMPAIGN_ID, status: { in: ["pending", "qualified", "redeemed"] } },
      });
      if (count >= CAP) {
        throw Object.assign(new Error("cap_reached"), { isCap: true });
      }
      const expiresAt = new Date(Date.now() + CLAIM_TTL_DAYS * 24 * 60 * 60 * 1000);
      return tx.campaignClaim.create({
        data: {
          campaign: CAMPAIGN_ID,
          walletAddress,
          userId: user.sub,
          status: "pending",
          expiresAt,
        },
      });
    });

    return Response.json({ claim });
  } catch (e: unknown) {
    const err = e as Error & { isCap?: boolean; code?: string };
    if (err.isCap) {
      return Response.json({ error: "Campaign is full.", code: "cap_reached" }, { status: 400 });
    }
    if (err.code === "P2002") {
      return Response.json({ error: "This wallet has already claimed.", code: "already_claimed" }, { status: 400 });
    }
    console.error("[campaigns/miracle/claim]", e);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export const POST = withMobileAuth(handler);
