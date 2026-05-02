"use client";

interface NewsItem {
  id?: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  image: string | null;
}

const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
  "COINDESK":    { bg: "#1a1a2e", color: "#14B8A6" },
  "DECRYPT":     { bg: "#0f172a", color: "#818cf8" },
  "THE BLOCK":   { bg: "#1e1b4b", color: "#a78bfa" },
  "DEFI PULSE":  { bg: "#052e16", color: "#4ade80" },
  "NFT NEWS":    { bg: "#1e1b4b", color: "#f472b6" },
  "CRYPTOSLATE": { bg: "#1a1a2e", color: "#fb923c" },
  "COINTELEGRAPH": { bg: "#1a1a2e", color: "#facc15" },
  "BITCOINIST":  { bg: "#1c1917", color: "#f97316" },
  "BEINCRYPTO":  { bg: "#0f172a", color: "#38bdf8" },
};

function getEmoji(title: string): string {
  const t = title.toLowerCase();
  if (/bitcoin|btc\b/.test(t))                               return "₿";
  if (/ethereum|eth\b/.test(t))                              return "◆";
  if (/solana|sol\b/.test(t))                                return "◎";
  if (/nft|non.fungible/.test(t))                            return "✦";
  if (/defi|decentralized finance|tvl/.test(t))              return "⟁";
  if (/usdc|usdt|stablecoin/.test(t))                        return "$";
  if (/layer.?2|l2|rollup|arbitrum|optimism/.test(t))        return "⬡";
  if (/ai\b|artificial intelligence|machine learning/.test(t)) return "◈";
  if (/hack|exploit|security|breach/.test(t))                return "⚠";
  if (/regulation|sec\b|law|legal/.test(t))                  return "⚖";
  if (/fund|venture|invest|capital/.test(t))                 return "◉";
  if (/market|price|rally|pump|dump|bull|bear/.test(t))      return "▲";
  return "◇";
}

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Web3NewsCard({ news }: { news: NewsItem }) {
  const { title, source, publishedAt, url } = news;
  const key = source.toUpperCase();
  const colors = SOURCE_COLORS[key] ?? { bg: "#0f172a", color: "#14B8A6" };
  const emoji = getEmoji(title);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        height: "100%",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Dark header band */}
      <div style={{
        background: colors.bg,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: colors.color, fontWeight: 700, lineHeight: 1, fontFamily: "Space Mono, monospace" }}>
            {emoji}
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, color: colors.color, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {source}
          </span>
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
          {timeAgo(publishedAt)}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
        <p style={{
          fontSize: 13, fontWeight: 600, color: "#111827",
          margin: 0, lineHeight: 1.55,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>
          {title}
        </p>
        <span style={{ fontSize: 11, color: "#14B8A6", fontWeight: 700, letterSpacing: "0.02em" }}>
          Read more →
        </span>
      </div>
    </a>
  );
}
