import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60; // cache 1 min

export async function GET(req: NextRequest) {
  const coinId = req.nextUrl.searchParams.get("coin") ?? "solana";
  const days   = req.nextUrl.searchParams.get("days") ?? "1";

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const raw: [number, number, number, number, number][] = await res.json();
    // [timestamp, open, high, low, close]
    const candles = raw.map(([time, open, high, low, close]) => ({
      time: Math.floor(time / 1000),
      open, high, low, close,
    }));
    return NextResponse.json({ candles });
  } catch {
    return NextResponse.json({ candles: [] }, { status: 200 });
  }
}
