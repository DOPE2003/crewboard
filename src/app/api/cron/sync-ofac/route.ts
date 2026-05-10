/**
 * GET /api/cron/sync-ofac
 *
 * Fetches the OFAC SDN list from US Treasury every 6h and syncs all Solana
 * addresses into the OfacSdnEntry table.  Replaces the full table on each run
 * so de-listed addresses are automatically removed.
 *
 * Protected by CRON_SECRET (same pattern as cancel-expired-orders).
 */
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
// Solana base58 address: 32–44 chars, no 0/O/I/l
const SOL_ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function parseSolanaAddresses(xml: string): string[] {
  const addresses: string[] = [];
  // Each <id>...</id> block holds one digital-currency entry
  const idBlockRe = /<id>([\s\S]*?)<\/id>/gi;
  let m: RegExpExecArray | null;

  while ((m = idBlockRe.exec(xml)) !== null) {
    const block = m[1];
    // Only SOL digital-currency-address entries
    if (!/Digital Currency Address/i.test(block)) continue;
    if (!/\bSOL\b/.test(block)) continue;

    const numMatch = /<idNumber>([^<]+)<\/idNumber>/i.exec(block);
    if (!numMatch) continue;

    const addr = numMatch[1].trim();
    if (SOL_ADDR_RE.test(addr)) addresses.push(addr);
  }

  return addresses;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startedAt = new Date();

  let xml: string;
  try {
    const res = await fetch(SDN_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Treasury returned ${res.status}`);
    xml = await res.text();
  } catch (e) {
    console.error("[sync-ofac] Failed to fetch SDN list:", e);
    return NextResponse.json({ error: "Failed to fetch SDN list" }, { status: 502 });
  }

  const addresses = parseSolanaAddresses(xml);

  // Replace the entire table atomically — handles de-listings cleanly
  await db.$transaction([
    db.ofacSdnEntry.deleteMany(),
    db.ofacSdnEntry.createMany({
      data: addresses.map((address) => ({ address })),
      skipDuplicates: true,
    }),
  ]);

  console.log(`[sync-ofac] Synced ${addresses.length} Solana SDN addresses at ${startedAt.toISOString()}`);

  return NextResponse.json({ ok: true, count: addresses.length, syncedAt: startedAt.toISOString() });
}
