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
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "#14B8A6", boxShadow: "0 0 8px rgba(20,184,166,0.7)" }}
            />
            <span className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-teal-600">
              Live Feed
            </span>
            <div
              className="inline-flex items-center gap-1.5 ml-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-widest text-red-500"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              LIVE
            </div>
          </div>

          <h2
            className="font-extrabold text-slate-900 tracking-tight leading-none m-0 mb-3"
            style={{ fontSize: "clamp(32px,4vw,48px)", letterSpacing: "-0.04em" }}
          >
            Web3 News
          </h2>
          <p className="text-[16.5px] text-slate-500 m-0 leading-relaxed">
            What&apos;s happening in crypto.{" "}
            <em className="text-slate-400 not-italic">Right now.</em>
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : news.map((item) => <Web3NewsCard key={item.id} news={item} />)
          }
        </div>

      </div>
    </section>
  );
}
