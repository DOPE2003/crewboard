/**
 * GET /api/mobile/sanctions/sol-list
 *
 * Returns all OFAC-sanctioned Solana addresses from the local mirror.
 * The mirror is refreshed every 6h by /api/cron/sync-ofac.
 *
 * Auth:  Bearer <mobile JWT>
 * 200:  { data: { addresses: string[] } }
 */
import { NextRequest } from "next/server";
import { withMobileAuth, MobileTokenPayload } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import db from "@/lib/db";

async function handler(_req: NextRequest, _user: MobileTokenPayload) {
  try {
    const rows = await db.ofacSdnEntry.findMany({ select: { address: true } });
    return ok({ addresses: rows.map((r) => r.address) });
  } catch (e) {
    console.error("[mobile/sanctions/sol-list]", e);
    return err("Failed to fetch SOL list.", 500);
  }
}

export const GET = withMobileAuth(handler);
