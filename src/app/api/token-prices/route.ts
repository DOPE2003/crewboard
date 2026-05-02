import { NextResponse } from "next/server";

export const revalidate = 30;

const COINS = [
  { id: "solana",           symbol: "SOL",   name: "Solana" },
  { id: "usd-coin",         symbol: "USDC",  name: "USD Coin" },
  { id: "bitcoin",          symbol: "BTC",   name: "Bitcoin" },
  { id: "ethereum",         symbol: "ETH",   name: "Ethereum" },
  { id: "bonk",             symbol: "BONK",  name: "Bonk" },
  { id: "jupiter-exchange-solana", symbol: "JUP", name: "Jupiter" },
  { id: "jito-governance-token",   symbol: "JTO", name: "Jito" },
  { id: "pyth-network",    symbol: "PYTH",  name: "Pyth" },
  { id: "raydium",          symbol: "RAY",   name: "Raydium" },
  { id: "orca",             symbol: "ORCA",  name: "Orca" },
];

export async function GET() {
  const ids = COINS.map((c) => c.id).join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      { next: { revalidate: 30 } }
    );
    const data = await res.json();
    const tokens = COINS.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      price: data[c.id]?.usd ?? 0,
      change24h: data[c.id]?.usd_24h_change ?? 0,
      marketCap: data[c.id]?.usd_market_cap ?? 0,
    }));
    return NextResponse.json({ tokens });
  } catch {
    return NextResponse.json({ tokens: COINS.map((c) => ({ ...c, price: 0, change24h: 0, marketCap: 0 })) });
  }
}
