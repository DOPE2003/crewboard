"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";

interface Props {
  categories: string[];
  defaultQ: string;
  defaultCategory: string;
  defaultMinPrice: string;
  defaultMaxPrice: string;
  defaultSort?: string;
}

export default function GigsFilters({ 
  categories, 
  defaultQ, 
  defaultCategory, 
  defaultMinPrice,
  defaultMaxPrice,
  defaultSort = "newest"
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [q, setQ] = useState(defaultQ);
  const [category, setCategory] = useState(defaultCategory);
  const [minPrice, setMinPrice] = useState(defaultMinPrice || "0");
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice || "5000");
  const [sort, setSort] = useState(defaultSort);

  const apply = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim())  params.set("q", q.trim());
    if (category)  params.set("category", category);
    
    const minVal = parseInt(minPrice, 10);
    const maxVal = parseInt(maxPrice, 10);
    
    if (minVal > 0) params.set("minPrice", minPrice);
    if (maxVal < 5000) params.set("maxPrice", maxPrice);
    if (sort !== "newest") params.set("sort", sort);
    
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname, q, category, minPrice, maxPrice, sort]);

  return (
    <div className="gigs-filter-bar" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "var(--card-bg)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--card-border)", marginBottom: "2rem" }}>
      
      {/* Top Row: Search & Category */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: "200px", position: "relative" }}>
          <input
            className="gigs-filter-input"
            placeholder="Search services..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--card-border)", background: "var(--card-bg)", outline: "none", color: "var(--foreground)" }}
          />
        </div>
        
        <select
          className="gigs-filter-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ flex: 1, minWidth: "150px", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", outline: "none" }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="gigs-filter-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ flex: 1, minWidth: "150px", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--foreground)", outline: "none" }}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="top_rated">Top Rated</option>
        </select>
      </div>

      {/* Bottom Row: Price Slider & Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price Range</span>
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "0.85rem", fontWeight: 700, color: "#2DD4BF" }}>
              ${minPrice} — ${maxPrice === "5000" ? "5000+" : maxPrice}
            </span>
          </div>
          
          <div style={{ position: "relative", height: "30px", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", width: "100%", height: "6px", borderRadius: "5px", background: "rgba(var(--foreground-rgb), 0.1)" }} />
            
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(parseInt(e.target.value), parseInt(maxPrice) - 50).toString())}
              style={{ position: "absolute", width: "100%", appearance: "none", background: "none", pointerEvents: "none", zIndex: 2, accentColor: "#2DD4BF" }}
              className="dual-range-input"
            />
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Math.max(parseInt(e.target.value), parseInt(minPrice) + 50).toString())}
              style={{ position: "absolute", width: "100%", appearance: "none", background: "none", pointerEvents: "none", zIndex: 2, accentColor: "#2DD4BF" }}
              className="dual-range-input"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            style={{ padding: "0.75rem 1.5rem", fontSize: "0.82rem", borderRadius: "10px", flex: "1 1 auto" }}
            onClick={apply}
          >
            Apply Filters
          </button>

          {(q || category || minPrice !== "0" || maxPrice !== "5000" || sort !== "newest") && (
            <button
              className="btn-secondary"
              style={{ padding: "0.75rem 1.25rem", fontSize: "0.82rem", borderRadius: "10px", background: "rgba(var(--foreground-rgb), 0.05)", border: "1px solid var(--card-border)", flex: "1 1 auto" }}
              onClick={() => {
                setQ("");
                setCategory("");
                setMinPrice("0");
                setMaxPrice("5000");
                setSort("newest");
                // Direct navigation for clear
                router.push(pathname);
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
