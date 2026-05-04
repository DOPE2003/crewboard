/**
 * GET /api/campaigns/miracle/eligibility?wallet=<addr>
 *
 * Public, unauthenticated. Returns whether a wallet is eligible for the
 * miracle-de-2026 campaign and whether a claim already exists.
 * Result is cached for 5 minutes per wallet.
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { checkWalletEligibility } from "@/lib/helius";

const CAMPAIGN_ID = "miracle-de-2026";
const CAP = 50;
const CACHE_TTL = 5 * 60; // seconds

// In-process cache (edge-safe: one instance per pod, good enough for 5-min TTL)
const cache = new Map<string, { result: unknown; expiresAt: number }>();

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.trim();
  if (!wallet) {
    return NextResponse.json({ error: "wallet param is required" }, { status: 400 });
  }

  // Check cache
  const cached = cache.get(wallet);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.result);
  }

  try {
    const [eligibility, existingClaim, claimedCount, campaign] = await Promise.all([
      checkWalletEligibility(wallet),
      db.campaignClaim.findFirst({
        where: { campaign: CAMPAIGN_ID, walletAddress: wallet },
      }),
      db.campaignClaim.count({
        where: { campaign: CAMPAIGN_ID, status: { in: ["pending", "qualified", "redeemed"] } },
      }),
      Promise.resolve({
        id: CAMPAIGN_ID,
        expiresAt: "2026-08-01T00:00:00Z",
      }),
    ]);

    const result = {
      eligible: eligibility.eligible,
      reasons: eligibility.eligible ? eligibility.reasons : (eligibility as { failReasons: string[] }).failReasons,
      claim: existingClaim ?? null,
      capRemaining: Math.max(0, CAP - claimedCount),
      campaign,
    };

    cache.set(wallet, { result, expiresAt: Date.now() + CACHE_TTL * 1000 });

    return NextResponse.json(result, {
      headers: { "Cache-Control": `private, max-age=${CACHE_TTL}` },
    });
  } catch (e) {
    console.error("[campaigns/miracle/eligibility]", e);
    return NextResponse.json({ error: "Failed to check eligibility." }, { status: 500 });
  }
}
