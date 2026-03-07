"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";

interface Props {
  categories: string[];
  defaultQ: string;
  defaultCategory: string;
  defaultMaxPrice: string;
}

export default function GigsFilters({ categories, defaultQ, defaultCategory, defaultMaxPrice }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(defaultQ);
  const [category, setCategory] = useState(defaultCategory);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);

  const apply = useCallback((newQ: string, newCat: string, newMax: string) => {
    const params = new URLSearchParams();
    if (newQ.trim())  params.set("q", newQ.trim());
    if (newCat)       params.set("category", newCat);
    if (newMax && parseInt(newMax, 10) > 0) params.set("maxPrice", newMax);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [router, pathname]);

  return (
    <div className="gigs-filter-bar">
      <input
        className="gigs-filter-input"
        placeholder="Search gigs..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") apply(q, category, maxPrice); }}
      />
      <select
        className="gigs-filter-select"
        value={category}
        onChange={(e) => { setCategory(e.target.value); apply(q, e.target.value, maxPrice); }}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input
        className="gigs-filter-input gigs-filter-price"
        type="number"
        placeholder="Max price ($)"
        min={1}
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") apply(q, category, maxPrice); }}
      />
      <button
        className="btn-primary"
        style={{ padding: "0.55rem 1.25rem", fontSize: "0.82rem" }}
        onClick={() => apply(q, category, maxPrice)}
      >
        Search
      </button>
      {(q || category || maxPrice) && (
        <button
          className="btn-secondary"
          style={{ padding: "0.55rem 1rem", fontSize: "0.82rem" }}
          onClick={() => { setQ(""); setCategory(""); setMaxPrice(""); apply("", "", ""); }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
