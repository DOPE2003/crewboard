/**
 * GET /api/mobile/sanctions/sol-list
 *
 * Returns all OFAC-sanctioned Solana addresses from the local mirror.
 * The mirror is refreshed every 6h by /api/cron/sync-ofac.
 *
 * Public — runs pre-login during wallet-connect / sign-up pre-check.
 * 200:  { data: { addresses: string[] } }
 */
import { ok, err } from "../../_lib/response";
import db from "@/lib/db";

export async function GET() {
  try {
    const rows = await db.ofacSdnEntry.findMany({ select: { address: true } });
    return ok({ addresses: rows.map((r) => r.address) });
  } catch (e) {
    console.error("[mobile/sanctions/sol-list]", e);
    return err("Failed to fetch SOL list.", 500);
  }
}
