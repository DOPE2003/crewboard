"use client";

interface NewsItem {
  id?: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  image: string | null;
}

/** Returns a relevant emoji based on keywords found in the title. */
function getEmoji(title: string): string {
  const t = title.toLowerCase();
  if (/bitcoin|btc\b/.test(t))                            return "🪙";
  if (/ethereum|eth\b/.test(t))                           return "💎";
  if (/solana|sol\b/.test(t))                             return "⚡";
  if (/nft|non.fungible/.test(t))                         return "🎨";
  if (/defi|decentralized finance|tvl/.test(t))           return "🏦";
  if (/usdc|usdt|stablecoin/.test(t))                     return "💵";
  if (/layer.?2|l2|rollup|arbitrum|optimism/.test(t))     return "🔄";
  if (/ai\b|artificial intelligence|machine learning/.test(t)) return "🤖";
  if (/web3|on.chain|blockchain/.test(t))                 return "🌐";
  if (/hack|exploit|security|breach|vuln/.test(t))        return "🔐";
  if (/airdrop/.test(t))                                  return "🪂";
  if (/ipo|listing|exchange/.test(t))                     return "🏪";
  if (/regulation|sec\b|law|legal|compliance/.test(t))    return "⚖️";
  if (/dao|governance|vote/.test(t))                      return "🗳️";
  if (/gaming|game|metaverse/.test(t))                    return "🎮";
  if (/fund|venture|invest|capital/.test(t))              return "💰";
  if (/market|price|rally|pump|dump|bull|bear/.test(t))   return "📈";
  if (/wallet|custody|self.custody/.test(t))              return "👛";
  if (/freelance|job|hire|talent/.test(t))                return "🤝";
  if (/million|billion|record|milestone/.test(t))         return "🏆";
  return "📰";
}

export default function Web3NewsCard({ news }: { news: NewsItem }) {
  const { title, source, publishedAt, url } = news;

  const hoursAgo = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
  const timeLabel = hoursAgo < 1 ? "just now" : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;

  const emoji = getEmoji(title);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-white border border-teal-100 rounded-2xl no-underline cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200"
      style={{
        minHeight: 180,
        boxShadow: "0 1px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {/* Top gradient band */}
      <div className="h-[3px] flex-shrink-0 rounded-t-2xl bg-gradient-to-r from-teal-400 via-indigo-400 to-sky-400" />

      <div className="flex flex-col flex-1 px-6 py-5 gap-3">
        {/* Source + time */}
        <div className="flex justify-between items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-600 truncate max-w-[65%]">
            {source}
          </span>
          <span className="text-[11px] text-slate-400 font-medium flex-shrink-0">{timeLabel}</span>
        </div>

        {/* Emoji + Title */}
        <div className="flex gap-2.5 items-start flex-1">
          <span className="text-[22px] flex-shrink-0 leading-tight mt-0.5" aria-hidden="true">
            {emoji}
          </span>
          <h3 className="text-[14px] font-semibold text-slate-900 leading-[1.55] m-0 line-clamp-3 flex-1">
            {title}
          </h3>
        </div>

        {/* CTA */}
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-teal-600 transition-[gap] duration-150 group-hover:gap-2.5 mt-1">
          Read more
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </span>
      </div>
    </a>
  );
}
