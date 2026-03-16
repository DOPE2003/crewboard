"use client";

import { useState } from "react";
import { savePortfolioItems, type PortfolioItem } from "@/actions/portfolio";
import { isSocialMediaUrl, SOCIAL_URL_ERROR } from "@/lib/socialLinks";

interface Props {
  initialItems: PortfolioItem[];
  handle: string;
}

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function PortfolioEditor({ initialItems, handle }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioItem>({ id: "", title: "", description: "", url: "", year: "" });

  async function save(updated: PortfolioItem[]) {
    setSaving(true);
    try { await savePortfolioItems(updated); } finally { setSaving(false); }
  }

  function startAdd() {
    setDraft({ id: genId(), title: "", description: "", url: "", year: new Date().getFullYear().toString() });
    setAdding(true);
  }

  async function confirmAdd() {
    if (!draft.title.trim()) return;
    if (draft.url && isSocialMediaUrl(draft.url)) {
      setUrlError(SOCIAL_URL_ERROR);
      return;
    }
    setUrlError(null);
    const updated = [...items, { ...draft, title: draft.title.trim(), description: draft.description.trim() }];
    setItems(updated);
    setAdding(false);
    await save(updated);
  }

  async function remove(id: string) {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    await save(updated);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8,
    border: "1px solid #e2e8f0", background: "#f8fafc",
    fontFamily: "Outfit, sans-serif", fontSize: "0.85rem", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div>
      {/* Existing items */}
      {items.length === 0 && !adding && (
        <div style={{ fontSize: "0.82rem", color: "#94a3b8", fontStyle: "italic", marginBottom: "0.75rem" }}>
          No portfolio projects yet. Add your first one.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "0.75rem" }}>
        {items.map(item => (
          <div key={item.id} style={{ padding: "0.85rem 1rem", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>{item.title}</div>
                {item.year && <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: 1 }}>{item.year}</div>}
                {item.description && <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.4rem 0 0", lineHeight: 1.6 }}>{item.description}</p>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem", color: "#2DD4BF", textDecoration: "none", display: "inline-block", marginTop: 4 }}>
                    View project →
                  </a>
                )}
              </div>
              <button onClick={() => remove(item.id)} title="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: "1rem", borderRadius: 10, border: "1px solid #2DD4BF", background: "rgba(45,212,191,0.04)", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input style={inp} placeholder="Project title *" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} maxLength={80} />
          <input style={inp} placeholder="Year (e.g. 2024)" value={draft.year} onChange={e => setDraft(d => ({ ...d, year: e.target.value }))} maxLength={10} />
          <textarea style={{ ...inp, resize: "vertical", minHeight: 70 }} placeholder="Short description" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} maxLength={300} />
          <div>
            <input style={inp} placeholder="Project URL (optional — no social media)" value={draft.url} onChange={e => { setDraft(d => ({ ...d, url: e.target.value })); setUrlError(null); }} maxLength={200} />
            {urlError && <div style={{ fontSize: "0.68rem", color: "#ef4444", marginTop: 3 }}>{urlError}</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={confirmAdd} disabled={!draft.title.trim() || saving} style={{ padding: "0.55rem 1.25rem", borderRadius: 8, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: "0.78rem", border: "none", cursor: "pointer" }}>
              {saving ? "Saving…" : "Add Project"}
            </button>
            <button onClick={() => setAdding(false)} style={{ padding: "0.55rem 1rem", borderRadius: 8, background: "none", color: "#64748b", fontWeight: 600, fontSize: "0.78rem", border: "1px solid #e2e8f0", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!adding && (
        <button onClick={startAdd} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.55rem 1.1rem", borderRadius: 8, background: "none", border: "1px dashed #cbd5e1", color: "#64748b", fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Project
        </button>
      )}
    </div>
  );
}
