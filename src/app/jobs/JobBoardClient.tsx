"use client";

import { useState } from "react";
import Link from "next/link";

// Per-category accent colours — give each vertical its own identity
const CAT: Record<string, { accent: string; label: string }> = {
  Development: { accent: "#00e5a0", label: "Development"  },
  Design:      { accent: "#ff6b6b", label: "Design"       },
  Marketing:   { accent: "#fbbf24", label: "Marketing"    },
  Community:   { accent: "#60a5fa", label: "Community"    },
  Research:    { accent: "#c084fc", label: "Research"     },
  Other:       { accent: "#14B8A6", label: "Other"        },
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

type Job = {
  id: string; title: string; company: string; budget: string;
  duration: string | null; category: string;
  level: string; jobType: string; tags: string[];
  description: string; milestones: boolean; createdAt: string;
  owner: { name: string | null; twitterHandle: string; image: string | null };
};

function JobCard({ job, isLoggedIn, index }: { job: Job; isLoggedIn: boolean; index: number }) {
  const [hovered, setHovered] = useState(false);
  const cat   = CAT[job.category] ?? CAT.Other;
  const owner = job.owner.name ?? `@${job.owner.twitterHandle}`;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "var(--dropdown-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px ${cat.accent}33`
          : "0 1px 4px rgba(0,0,0,0.06)",
        borderColor: hovered ? `${cat.accent}55` : "var(--card-border)",
        animationDelay: `${index * 40}ms`,
        animation: "jb-fade-in 0.4s ease both",
      }}
    >
      {/* Category accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cat.accent}, ${cat.accent}44)` }} />

      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Header: title + budget */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, overflow: "hidden" }}>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            {/* Category label */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              marginBottom: 7,
            }}>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700,
                color: cat.accent, opacity: 0.9,
              }}>
                {cat.label}
              </span>
              <span style={{ width: 1, height: 10, background: "var(--card-border)" }} />
              <span style={{
                fontSize: "0.65rem", color: "var(--text-muted)",
              }}>
                {job.jobType}
              </span>
            </div>

            <h3 style={{
              margin: 0,
              fontSize: "1.02rem",
              fontWeight: 800,
              lineHeight: 1.2,
              color: "var(--foreground)",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}>
              {job.title}
            </h3>
            <p style={{
              margin: "4px 0 0",
              fontSize: "0.76rem",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}>
              {job.company}
            </p>
          </div>

          {/* Budget — hero number */}
          <div style={{
            flexShrink: 0,
            maxWidth: "38%",
            textAlign: "right",
            padding: "6px 10px",
            borderRadius: 10,
            background: `${cat.accent}12`,
            border: `1px solid ${cat.accent}28`,
          }}>
            <div style={{
              fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: cat.accent,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
              lineHeight: 1.3,
            }}>
              {job.budget}
            </div>
            {job.duration && (
              <div style={{
                fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
                fontSize: "0.58rem",
                color: "var(--text-muted)",
                marginTop: 1,
              }}>
                {job.duration}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: 0,
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {job.description}
        </p>

        {/* Pills row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          <span style={{
            padding: "3px 9px", borderRadius: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--card-border)",
            fontSize: "0.68rem", fontWeight: 600,
            color: "var(--text-muted)",
            letterSpacing: "0.03em",
          }}>
            {job.level}
          </span>
          {job.milestones && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "3px 9px", borderRadius: 6,
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.2)",
              fontSize: "0.68rem", fontWeight: 600, color: "#a78bfa",
            }}>
              ◈ Milestones
            </span>
          )}
          {job.tags.slice(0, 4).map(tag => (
            <span key={tag} style={{
              padding: "3px 9px", borderRadius: 6,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--card-border)",
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "auto",
          paddingTop: 14,
          borderTop: "1px solid var(--card-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        }}>
          {/* Owner */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            {job.owner.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.owner.image} alt=""
                style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${cat.accent}44` }} />
            ) : (
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: cat.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#000", fontWeight: 800,
              }}>
                {owner[0].toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontSize: "0.72rem", color: "var(--text-muted)",
                fontWeight: 500,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "block", maxWidth: 130,
              }}>
                {owner}
              </span>
              <span style={{
                fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
                fontSize: "0.6rem", color: "var(--text-muted)", opacity: 0.6,
              }} suppressHydrationWarning>
                {timeAgo(job.createdAt)}
              </span>
            </div>
          </div>

          {/* Apply CTA */}
          <Link
            href={isLoggedIn ? `/jobs/${job.id}/apply` : `/login?callbackUrl=/jobs/${job.id}/apply`}
            style={{
              flexShrink: 0,
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "8px 18px", borderRadius: 10,
              background: hovered ? cat.accent : "transparent",
              border: `1.5px solid ${cat.accent}`,
              color: hovered ? "#000" : cat.accent,
              fontWeight: 700, fontSize: "0.75rem",
              textDecoration: "none",
              transition: "background 0.15s, color 0.15s",
              letterSpacing: "0.02em",
            }}
          >
            Apply
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function JobBoardClient({ jobs, isLoggedIn }: { jobs: Job[]; isLoggedIn: boolean }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.tags.some(t => t.toLowerCase().includes(q)) ||
      j.category.toLowerCase().includes(q);
    const matchesCat = !activeCategory || j.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const categories = Array.from(new Set(jobs.map(j => j.category)));

  return (
    <>
      <style>{`
        @keyframes jb-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes jb-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Toolbar: search + category filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            placeholder="Search title, skill, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", height: 42, paddingLeft: 38, paddingRight: 14,
              border: "1px solid var(--card-border)", borderRadius: 10,
              background: "var(--dropdown-bg)", color: "var(--foreground)",
              fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Category chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700,
              border: "1px solid var(--card-border)",
              background: !activeCategory ? "var(--foreground)" : "transparent",
              color: !activeCategory ? "var(--background)" : "var(--text-muted)",
              cursor: "pointer", letterSpacing: "0.04em",
              fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
              transition: "all 0.12s",
            }}
          >
            ALL
          </button>
          {categories.map(cat => {
            const c = CAT[cat] ?? CAT.Other;
            const active = activeCategory === cat;
            return (
              <button key={cat}
                onClick={() => setActiveCategory(active ? null : cat)}
                style={{
                  padding: "6px 14px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 700,
                  border: `1px solid ${active ? c.accent : "var(--card-border)"}`,
                  background: active ? `${c.accent}18` : "transparent",
                  color: active ? c.accent : "var(--text-muted)",
                  cursor: "pointer", letterSpacing: "0.04em",
                  fontFamily: "inherit",
                  transition: "all 0.12s",
                }}
              >
                {CAT[cat]?.label ?? cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count */}
      {(search || activeCategory) && (
        <p style={{
          fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16,
          fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
        }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--foreground)", margin: "0 0 8px" }}>
            No jobs found
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 24px", maxWidth: 280, marginInline: "auto", lineHeight: 1.65 }}>
            {search ? "Try a different keyword or clear the filter." : "No jobs posted yet — be the first."}
          </p>
          {!search && (
            <Link
              href={isLoggedIn ? "/jobs/new" : "/login"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "#14B8A6", color: "#000",
                fontWeight: 700, fontSize: "0.85rem", padding: "10px 24px", borderRadius: 10,
                textDecoration: "none",
              }}
            >
              Post a job →
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}>
          {filtered.map((job, i) => (
            <JobCard key={job.id} job={job} isLoggedIn={isLoggedIn} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
