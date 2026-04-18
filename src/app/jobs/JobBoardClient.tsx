"use client";

import { useState } from "react";
import Link from "next/link";

const CHAIN_COLORS: Record<string, string> = {
  ETH: "#627EEA", SOL: "#9945FF", BASE: "#0052FF",
  ARB: "#28A0F0", AVAX: "#E84142", BNB: "#F3BA2F",
};

const CATEGORY_ICONS: Record<string, string> = {
  Development: "⌨️", Design: "🎨", Marketing: "📣",
  Community: "👥", Research: "🔬", Other: "✦",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

type Job = {
  id: string; title: string; company: string; budget: string;
  duration: string | null; chain: string; category: string;
  level: string; jobType: string; tags: string[];
  description: string; milestones: boolean; createdAt: string;
  owner: { name: string | null; twitterHandle: string; image: string | null };
};

export default function JobBoardClient({
  jobs, chains, isLoggedIn,
}: {
  jobs: Job[]; chains: string[]; isLoggedIn: boolean;
}) {
  const [activeChain, setActiveChain] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter(j => {
    const matchChain = activeChain === "ALL" || j.chain === activeChain;
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.tags.some(t => t.toLowerCase().includes(q)) ||
      j.category.toLowerCase().includes(q);
    return matchChain && matchSearch;
  });

  return (
    <>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          placeholder="Search title, skill..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", height: 44, paddingLeft: 38, paddingRight: 16,
            border: "1px solid var(--card-border)", borderRadius: 12,
            background: "var(--background)", color: "var(--foreground)",
            fontSize: 14, outline: "none", boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Chain filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
        {chains.map(chain => {
          const active = activeChain === chain;
          const color = chain === "ALL" ? "#14B8A6" : (CHAIN_COLORS[chain] ?? "#14B8A6");
          return (
            <button
              key={chain}
              onClick={() => setActiveChain(chain)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 99, flexShrink: 0,
                border: `1.5px solid ${active ? color : "var(--card-border)"}`,
                background: active ? color : "transparent",
                color: active ? "#fff" : "var(--foreground)",
                fontFamily: "Inter, sans-serif", fontWeight: 700,
                fontSize: "0.75rem", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {chain !== "ALL" && (
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: active ? "rgba(255,255,255,0.7)" : color,
                  flexShrink: 0,
                }} />
              )}
              {chain}
            </button>
          );
        })}
      </div>

      {/* Jobs list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "rgba(20,184,166,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 17, color: "var(--foreground)", margin: "0 0 8px" }}>
            No jobs found
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 24px", maxWidth: 280, marginInline: "auto", lineHeight: 1.65 }}>
            Be the first to post a Web3 gig and get matched with top freelancers in minutes.
          </p>
          <Link
            href={isLoggedIn ? "/jobs/new" : "/login"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "#14B8A6", color: "#fff",
              fontFamily: "Inter, sans-serif", fontWeight: 700,
              fontSize: "0.82rem", padding: "10px 24px", borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Post Job
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(job => {
            const chainColor = CHAIN_COLORS[job.chain] ?? "#14B8A6";
            const catIcon = CATEGORY_ICONS[job.category] ?? "✦";
            const ownerName = job.owner.name ?? `@${job.owner.twitterHandle}`;
            return (
              <div
                key={job.id}
                style={{
                  padding: "18px 20px",
                  border: "1px solid var(--card-border)",
                  borderRadius: 16,
                  background: "var(--dropdown-bg)",
                  display: "flex", flexDirection: "column", gap: 10,
                  transition: "border-color 0.15s",
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", margin: "0 0 4px", lineHeight: 1.25 }}>
                      {job.title}
                    </h3>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {job.company}
                    </span>
                  </div>
                  {/* Chain badge */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 99,
                    background: `${chainColor}18`, color: chainColor,
                    border: `1px solid ${chainColor}35`,
                    fontFamily: "Inter, sans-serif", fontWeight: 700,
                    fontSize: "0.72rem", flexShrink: 0,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: chainColor }} />
                    {job.chain}
                  </span>
                </div>

                {/* Budget + meta pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {/* Budget */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 99,
                    background: "rgba(20,184,166,0.1)", color: "#14B8A6",
                    fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.72rem",
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {job.budget}
                  </span>
                  {/* Category */}
                  <span style={{
                    padding: "3px 10px", borderRadius: 99,
                    background: "rgba(var(--foreground-rgb,0,0,0),0.05)",
                    color: "var(--text-muted)", fontFamily: "Inter, sans-serif",
                    fontWeight: 600, fontSize: "0.72rem",
                  }}>
                    {catIcon} {job.category}
                  </span>
                  {/* Level */}
                  <span style={{
                    padding: "3px 10px", borderRadius: 99,
                    background: "rgba(var(--foreground-rgb,0,0,0),0.05)",
                    color: "var(--text-muted)", fontFamily: "Inter, sans-serif",
                    fontWeight: 600, fontSize: "0.72rem",
                  }}>
                    {job.level}
                  </span>
                  {/* Job type */}
                  <span style={{
                    padding: "3px 10px", borderRadius: 99,
                    background: "rgba(var(--foreground-rgb,0,0,0),0.05)",
                    color: "var(--text-muted)", fontFamily: "Inter, sans-serif",
                    fontWeight: 600, fontSize: "0.72rem",
                  }}>
                    {job.jobType}
                  </span>
                  {/* Milestones */}
                  {job.milestones && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 10px", borderRadius: 99,
                      background: "rgba(139,92,246,0.1)", color: "#8b5cf6",
                      fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.72rem",
                    }}>
                      ▮▮▮ Milestones
                    </span>
                  )}
                  {/* Duration */}
                  {job.duration && (
                    <span style={{
                      padding: "3px 10px", borderRadius: 99,
                      background: "rgba(var(--foreground-rgb,0,0,0),0.05)",
                      color: "var(--text-muted)", fontFamily: "Inter, sans-serif",
                      fontWeight: 600, fontSize: "0.72rem",
                    }}>
                      {job.duration}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {job.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {job.tags.map(tag => (
                      <span key={tag} style={{
                        padding: "2px 8px", borderRadius: 6,
                        border: "1px solid var(--card-border)",
                        fontFamily: "Inter, sans-serif", fontSize: "0.68rem",
                        color: "var(--text-muted)",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.65, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {job.description}
                </p>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {job.owner.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={job.owner.image} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>
                        {ownerName[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {ownerName} · <span suppressHydrationWarning>{timeAgo(job.createdAt)}</span>
                    </span>
                  </div>
                  <Link
                    href={`/talent`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 14px", borderRadius: 8,
                      border: "1.5px solid #14B8A6", color: "#14B8A6",
                      fontFamily: "Inter, sans-serif", fontWeight: 700,
                      fontSize: "0.72rem", textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    Apply →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
