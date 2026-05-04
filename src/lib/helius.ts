/**
 * Helius RPC helpers for campaign eligibility checks.
 * Requires HELIUS_API_KEY env var.
 */

const HELIUS_BASE = () => {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error("HELIUS_API_KEY is not set");
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
};

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DAYS_180 = 180 * 24 * 60 * 60 * 1000;

async function rpc(method: string, params: unknown[]) {
  const res = await fetch(HELIUS_BASE(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    next: { revalidate: 0 },
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "Helius RPC error");
  return json.result;
}

async function getWalletAgeMs(walletAddress: string): Promise<number | null> {
  const sigs = await rpc("getSignaturesForAddress", [
    walletAddress,
    { limit: 1, commitment: "confirmed" },
  ]);
  if (!Array.isArray(sigs) || sigs.length === 0) return null;
  const firstTx = sigs[sigs.length - 1];
  if (!firstTx?.blockTime) return null;
  return Date.now() - firstTx.blockTime * 1000;
}

async function getUsdcBalanceLamports(walletAddress: string): Promise<number> {
  const result = await rpc("getTokenAccountsByOwner", [
    walletAddress,
    { mint: USDC_MINT },
    { encoding: "jsonParsed" },
  ]);
  const accounts = result?.value ?? [];
  let total = 0;
  for (const acct of accounts) {
    const amount = acct?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
    total += amount;
  }
  return total;
}

async function hasRecentDeFiActivity(walletAddress: string): Promise<boolean> {
  const since = Math.floor((Date.now() - DAYS_180) / 1000);
  const sigs = await rpc("getSignaturesForAddress", [
    walletAddress,
    { limit: 100, commitment: "confirmed" },
  ]);
  if (!Array.isArray(sigs)) return false;
  const recent = sigs.filter((s: { blockTime?: number }) => (s.blockTime ?? 0) >= since);
  return recent.length > 0;
}

export type EligibilityResult =
  | { eligible: true; reasons: string[] }
  | { eligible: false; reasons: string[]; failReasons: string[] };

export async function checkWalletEligibility(walletAddress: string): Promise<EligibilityResult> {
  const WALLET_AGE_DAYS = 60;
  const MIN_USDC = 100;

  const reasons: string[] = [];
  const failReasons: string[] = [];

  const [ageMs, usdcBalance, activity] = await Promise.all([
    getWalletAgeMs(walletAddress).catch(() => null),
    getUsdcBalanceLamports(walletAddress).catch(() => 0),
    hasRecentDeFiActivity(walletAddress).catch(() => false),
  ]);

  const ageDays = ageMs != null ? ageMs / (24 * 60 * 60 * 1000) : 0;

  if (ageMs != null && ageDays >= WALLET_AGE_DAYS) {
    reasons.push("wallet_age_ok");
  } else {
    failReasons.push("wallet_too_new");
  }

  if (usdcBalance >= MIN_USDC) {
    reasons.push("usdc_balance_ok");
  } else {
    failReasons.push("usdc_balance_low");
  }

  if (activity) {
    reasons.push("activity_ok");
  } else {
    failReasons.push("no_recent_activity");
  }

  if (failReasons.length === 0) {
    return { eligible: true, reasons };
  }
  return { eligible: false, reasons, failReasons };
}
