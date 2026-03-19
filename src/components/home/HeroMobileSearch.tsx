"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchBuilders } from "@/actions/search";

interface Result {
  name: string | null;
  twitterHandle: string;
  image: string | null;
  role: string | null;
}

export default function HeroMobileSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    try {
      const data = await searchBuilders(q);
      setResults(data);
      setOpen(data.length > 0);
      setFocused(-1);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchResults(query), 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, fetchResults]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigate = (handle: string) => {
    setQuery("");
    setOpen(false);
    router.push(`/u/${handle}`);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focused >= 0 && results[focused]) {
        navigate(results[focused].twitterHandle);
      } else if (query.trim()) {
        router.push(`/talent?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocused(-1);
    }
  };

  return (
    <div ref={wrapRef} className="hero-mobile-search-wrap">
      <div className="hero-mobile-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search talent..."
          autoComplete="off"
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "12px",
          overflow: "hidden",
          zIndex: 9999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}>
          {results.map((r, i) => (
            <button
              key={r.twitterHandle}
              onMouseDown={() => navigate(r.twitterHandle)}
              onMouseEnter={() => setFocused(i)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1rem",
                background: focused === i ? "rgba(0,0,0,0.04)" : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" width={30} height={30} style={{ borderRadius: "50%", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.08)", flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#000", lineHeight: 1.2 }}>
                  {r.name ?? r.twitterHandle}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.62rem", color: "rgba(0,0,0,0.45)" }}>
                  @{r.twitterHandle}{r.role ? ` · ${r.role}` : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
