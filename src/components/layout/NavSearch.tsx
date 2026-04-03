"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function NavSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ users: any[]; gigs: any[] }>({ users: [], gigs: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults({ users: [], gigs: [] });
      setIsOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch { /* ignore */ }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const hasResults = results.users.length > 0 || results.gigs.length > 0;
  const showEmpty = isOpen && query.length >= 2 && !isLoading && !hasResults;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <form onSubmit={handleSubmit}>
        <div className="nav-search-box" style={{
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          height: 40,
          border: "1.5px solid var(--card-border)",
          borderRadius: 999,
          overflow: "hidden",
          background: "var(--background)",
          transition: "box-shadow 0.2s",
          boxShadow: isOpen ? "0 0 0 2px rgba(20,184,166,0.18)" : "none",
        }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => hasResults && setIsOpen(true)}
            placeholder="Search talent or services..."
            autoComplete="off"
            className="nav-search-input"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "0 16px",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "var(--foreground)",
              background: "transparent",
              minWidth: 0,
              height: "100%",
            }}
          />
          <button
            type="submit"
            style={{
              background: "#14B8A6",
              border: "none",
              borderRadius: "0 999px 999px 0",
              padding: "0 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              height: "100%",
            }}
          >
            {isLoading ? (
              <div style={{
                width: 14, height: 14,
                border: "2px solid white",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Live dropdown — results */}
      {isOpen && hasResults && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          zIndex: 9999,
          overflow: "hidden",
          maxHeight: 480,
          overflowY: "auto",
        }}>
          {/* Talent */}
          {results.users.length > 0 && (
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, color: "#9ca3af",
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "12px 16px 6px", margin: 0,
              }}>
                TALENT
              </p>
              {results.users.map((user: any) => (
                <a
                  key={user.id}
                  href={`/u/${user.twitterHandle}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--foreground-rgb),0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {user.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={user.image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#14B8A6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>
                      {(user.name ?? user.twitterHandle)[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.name ?? `@${user.twitterHandle}`}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                      {user.role ?? "Freelancer"}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, flexShrink: 0,
                    background: user.availability === "available" ? "#dcfce7" : "#f3f4f6",
                    color: user.availability === "available" ? "#16a34a" : "#9ca3af",
                  }}>
                    {user.availability === "available" ? "Available" : "Busy"}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Divider */}
          {results.users.length > 0 && results.gigs.length > 0 && (
            <div style={{ height: 1, background: "var(--card-border)", margin: "4px 0" }} />
          )}

          {/* Services */}
          {results.gigs.length > 0 && (
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, color: "#9ca3af",
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "12px 16px 6px", margin: 0,
              }}>
                SERVICES
              </p>
              {results.gigs.map((gig: any) => (
                <a
                  key={gig.id}
                  href={`/gigs/${gig.id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 16px", textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(var(--foreground-rgb),0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {gig.title}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{gig.category}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#14B8A6", flexShrink: 0 }}>
                    ${gig.price}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* View all */}
          <div style={{ padding: "8px 16px 12px", borderTop: "1px solid var(--card-border)" }}>
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }}
              style={{
                width: "100%", padding: "8px", borderRadius: 10,
                background: "rgba(var(--foreground-rgb),0.03)",
                border: "1px solid var(--card-border)",
                fontSize: 12, fontWeight: 600, color: "#14B8A6",
                cursor: "pointer", textAlign: "center",
              }}
            >
              See all results for &ldquo;{query}&rdquo; →
            </button>
          </div>
        </div>
      )}

      {/* Live dropdown — no results */}
      {showEmpty && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          zIndex: 9999,
          padding: "24px 16px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
