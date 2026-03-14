"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { searchBuilders } from "@/actions/search";
import { useLanguage } from "@/contexts/LanguageContext";

interface Result {
  name: string | null;
  twitterHandle: string;
  image: string | null;
  role: string | null;
}

export default function NavSearch() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* ── fetch with debounce ── */
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const data = await searchBuilders(query);
        setResults(data);
        setOpen(data.length > 0);
        setFocused(-1);
      } catch { /* ignore */ }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  /* ── close on outside click ── */
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
    setFocused(-1);
    router.push(`/u/${handle}`);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocused((f) => Math.min(f + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocused((f) => Math.max(f - 1, -1));
    } else if (e.key === "Enter" && focused >= 0) {
      e.preventDefault();
      navigate(results[focused].twitterHandle);
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocused(-1);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Search box */}
      <div className="nav-search-box" style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "rgba(0,0,0,0.04)",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: "999px",
        padding: "0.45rem 1rem",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="rgba(0,0,0,0.4)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t("nav.search")}
          autoComplete="off"
          className="nav-search-input"
          style={{
            background: "none",
            border: "none",
            outline: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: "0.82rem",
            width: "440px",
          }}
        />
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="nav-search-dropdown" style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          borderRadius: "10px",
          overflow: "hidden",
          zIndex: 9999,
          minWidth: "260px",
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
                padding: "0.65rem 0.9rem",
                background: focused === i ? "rgba(0,0,0,0.04)" : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              {r.image ? (
                <Image
                  src={r.image}
                  alt=""
                  width={30}
                  height={30}
                  style={{ borderRadius: "50%", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(0,0,0,0.08)", flexShrink: 0,
                }} />
              )}
              <div>
                <div style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#000",
                  lineHeight: 1.2,
                }}>
                  {r.name ?? r.twitterHandle}
                </div>
                <div style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "0.65rem",
                  color: "rgba(0,0,0,0.45)",
                  letterSpacing: "0.04em",
                }}>
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
