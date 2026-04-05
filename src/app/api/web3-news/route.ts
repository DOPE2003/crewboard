import { NextResponse } from "next/server";

export const revalidate = 60;

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  image: string | null;
}

// Scrape the og:image from an article page.
// Times out after 4s and never throws — returns null on any failure.
async function getOGImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Crewboard/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    // Only read first 50KB — the og:image tag is always in <head>
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    let bytes = 0;
    while (bytes < 50_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      bytes += value.byteLength;
    }
    reader.cancel();

    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// Enrich a raw list of items: fill missing images via OG scraping in parallel.
async function enrichWithImages(items: NewsItem[]): Promise<NewsItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.image) return item;
      const image = await getOGImage(item.url);
      return { ...item, image };
    })
  );
}

const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Solana hits new milestone with 65,000 TPS in latest stress test",
    source: "CoinDesk",
    publishedAt: new Date().toISOString(),
    url: "https://coindesk.com",
    image: null,
  },
  {
    id: "2",
    title: "Web3 freelance market expected to reach $5B by 2026",
    source: "Decrypt",
    publishedAt: new Date(Date.now() - 3_600_000).toISOString(),
    url: "https://decrypt.co",
    image: null,
  },
  {
    id: "3",
    title: "USDC stablecoin volume surpasses $10T in cumulative on-chain transfers",
    source: "The Block",
    publishedAt: new Date(Date.now() - 7_200_000).toISOString(),
    url: "https://theblock.co",
    image: null,
  },
  {
    id: "4",
    title: "Ethereum Layer-2 ecosystem records record $12B TVL this quarter",
    source: "DeFi Pulse",
    publishedAt: new Date(Date.now() - 10_800_000).toISOString(),
    url: "https://defipulse.com",
    image: null,
  },
  {
    id: "5",
    title: "NFT marketplace volume rebounds 40% as new collections launch",
    source: "NFT News",
    publishedAt: new Date(Date.now() - 14_400_000).toISOString(),
    url: "https://nftnews.com",
    image: null,
  },
  {
    id: "6",
    title: "Bitcoin dominance climbs as altcoin season appears delayed",
    source: "CryptoSlate",
    publishedAt: new Date(Date.now() - 18_000_000).toISOString(),
    url: "https://cryptoslate.com",
    image: null,
  },
];

export async function GET() {
  try {
    // ── CryptoPanic ────────────────────────────────────────────
    const cpKey = process.env.CRYPTOPANIC_API_KEY;
    if (cpKey) {
      const res = await fetch(
        `https://cryptopanic.com/api/free/v1/posts/?auth_token=${cpKey}&filter=hot&kind=news`,
        { next: { revalidate: 60 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          const raw: NewsItem[] = data.results.slice(0, 9).map((item: any) => ({
            id: String(item.id),
            title: item.title,
            source: item.source?.title ?? "Crypto News",
            publishedAt: item.published_at,
            url: item.url,
            image: item.metadata?.image ?? null,
          }));
          const news = await enrichWithImages(raw);
          return NextResponse.json({ news });
        }
      }
    }

    // ── NewsAPI ────────────────────────────────────────────────
    const naKey = process.env.NEWS_API_KEY;
    if (naKey) {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=crypto+web3+blockchain&sortBy=publishedAt&pageSize=9&apiKey=${naKey}`,
        { next: { revalidate: 60 } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          const raw: NewsItem[] = data.articles.slice(0, 9).map((item: any, i: number) => ({
            id: String(i),
            title: item.title,
            source: item.source?.name ?? "Crypto News",
            publishedAt: item.publishedAt,
            url: item.url,
            image: item.urlToImage ?? null,
          }));
          const news = await enrichWithImages(raw);
          return NextResponse.json({ news });
        }
      }
    }

    // ── Mock fallback ──────────────────────────────────────────
    return NextResponse.json({ news: MOCK_NEWS });
  } catch (err) {
    console.error("[web3-news] fetch failed:", err);
    return NextResponse.json({ news: MOCK_NEWS });
  }
}
