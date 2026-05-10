import db from "@/lib/db";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  blocked: boolean;
  reason?: string;
  source?: string;
  expiresAt: number;
}

// In-process cache — consistent with the existing rate-limit approach in this codebase
const cache = new Map<string, CacheEntry>();

export interface ScreenResult {
  blocked: boolean;
  reason?: string;
  source?: string;
  checkedAt: string;
}

// Primary: local OFAC SDN mirror (zero cost, zero latency, refreshed every 6h by cron)
async function checkLocalOfac(address: string): Promise<ScreenResult | null> {
  const entry = await db.ofacSdnEntry.findUnique({ where: { address } });
  if (!entry) return null;
  return { blocked: true, reason: "ofac_sdn", source: "ofac_xml", checkedAt: new Date().toISOString() };
}

// Supplement: Chainalysis (deeper coverage — only used when CHAINALYSIS_API_KEY is set)
async function checkChainalysis(address: string): Promise<ScreenResult> {
  const apiKey = process.env.CHAINALYSIS_API_KEY;
  const checkedAt = new Date().toISOString();

  if (!apiKey) return { blocked: false, checkedAt };

  let res: Response;
  try {
    res = await fetch(`https://public.chainalysis.com/api/v1/address/${address}`, {
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("[sanctions] Chainalysis fetch error:", e);
    return { blocked: false, checkedAt };
  }

  if (!res.ok) {
    console.error(`[sanctions] Chainalysis API ${res.status} for ${address}`);
    return { blocked: false, checkedAt };
  }

  const data = await res.json() as { identifications?: { category?: string }[] };
  const ids = data.identifications ?? [];

  if (ids.length > 0) {
    const reason = ids[0]?.category ?? "ofac_sdn";
    return { blocked: true, reason, source: "chainalysis", checkedAt };
  }

  return { blocked: false, source: "chainalysis", checkedAt };
}

export async function screenAddress(
  address: string,
  chain = "solana",
  context?: { userUid?: string; trigger?: string },
): Promise<ScreenResult> {
  const key = `${chain}:${address}`;
  const now = Date.now();

  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return { blocked: hit.blocked, reason: hit.reason, source: hit.source, checkedAt: new Date().toISOString() };
  }

  // 1. Local OFAC SDN mirror (fast, always available)
  const local = await checkLocalOfac(address);
  // 2. Chainalysis as supplement (deeper coverage, only if key is configured)
  const result = local ?? await checkChainalysis(address);

  cache.set(key, { blocked: result.blocked, reason: result.reason, source: result.source, expiresAt: now + CACHE_TTL_MS });

  if (result.blocked) {
    // Append-only audit log — never delete (OFAC 7-year retention requirement)
    await db.sanctionsBlock.create({
      data: {
        address,
        chain,
        reason: result.reason ?? "unknown",
        source: result.source ?? "unknown",
        userUid: context?.userUid,
        context: context?.trigger,
      },
    }).catch((e) => console.error("[sanctions] Failed to write audit log:", e));
  }

  return result;
}
