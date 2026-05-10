/**
 * POST /api/mobile/sanctions/check
 *
 * Live OFAC sanctions check for a wallet address via Chainalysis.
 * Results are cached in-process for 24h to conserve API quota.
 *
 * Public — runs pre-login during wallet-connect / sign-up pre-check.
 * Body: { "address": string, "chain"?: string }
 *
 * 200 clean:     { data: { blocked: false, checkedAt: ISO } }
 * 200 sanctioned: { data: { blocked: true, reason: string, source: string, checkedAt: ISO } }
 */
import { NextRequest } from "next/server";
import { ok, err } from "../../_lib/response";
import { screenAddress } from "@/lib/sanctions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { address, chain = "solana" } = body as { address?: string; chain?: string };

    if (!address || typeof address !== "string") return err("address is required.");

    const result = await screenAddress(address, chain, { trigger: "wallet_connect" });

    return ok(result);
  } catch (e) {
    console.error("[mobile/sanctions/check]", e);
    return err("Sanctions check failed.", 500);
  }
}
