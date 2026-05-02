"use client";

import { useState, useEffect, useCallback } from "react";
import Web3NewsCard from "./Web3NewsCard";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  image: string | null;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="h-5 w-20 rounded-full bg-slate-100 animate-pulse" />
        <div className="h-4 w-12 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="h-4 w-full rounded bg-slate-100 animate-pulse" />
      <div className="h-4 w-4/5 rounded bg-slate-100 animate-pulse" />
      <div className="h-4 w-3/5 rounded bg-slate-100 animate-pulse" />
      <div className="h-4 w-16 rounded bg-slate-100 animate-pulse mt-1" />
    </div>
  );
}

export default function Web3NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/web3-news");
      if (!res.ok) return;
      const data: { news: NewsItem[] } = await res.json();
      if (data.news?.length > 0) setNews(data.news);
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 60_000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  if (!loading && news.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden border-t"
      style={{
        background: "linear-gradient(180deg, #f8fafc 0%, #f0fdf9 50%, #f8fafc 100%)",
        padding: "96px 24px 108px",
        borderTopColor: "rgba(20,184,166,0.08)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -140, left: "50%", transform: "translateX(-50%)",
          width: 800, height: 440,
          background: "radial-gradient(ellipse at 50% 40%, rgba(20,184,166,0.09) 0%, transparent 65%)",
          filter: "blur(48px)",
        }}
      />

      <div className="relative z-10 mx-auto" style={{ maxWidth: 1400 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 99, padding: "4px 10px",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "livePulse 1.5s infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
            <h2 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.03em" }}>
              Web3 News
            </h2>
          </div>
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            What&apos;s happening in crypto right now
          </p>
          <style>{`
            @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
          `}</style>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          alignItems: "stretch",
        }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : news.map((item) => <Web3NewsCard key={item.id} news={item} />)
          }
        </div>

      </div>
    </section>
  );
}
