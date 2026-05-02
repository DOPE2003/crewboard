"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateGig } from "@/actions/gigs";

const GIG_CATEGORIES = [
  "KOL Manager", "Exchange Listings Manager", "Web3 Web Designer",
  "Social Marketing", "Artist", "Video & Animation", "Coding & Tech",
  "AI Engineer", "Content Creator", "Graphic & Design",
];

const SKILL_PRESETS = [
  "Solidity", "Smart Contracts", "UI/UX", "NFT", "DeFi",
  "React", "Web3.js", "Figma", "TypeScript", "Node.js",
  "IPFS", "Ethereum", "Polygon", "DAO", "Tokenomics",
  "Motion Design", "Copywriting", "Community", "Discord", "Twitter/X",
];

export default function EditGigPage() {
  const router    = useRouter();
  const params    = useParams();
  const gigId     = params.id as string;
  const { status } = useSession();

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [price, setPrice]             = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [image, setImage]             = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    fetch(`/api/gigs/${gigId}`)
      .then((r) => r.json())
      .then((gig) => {
        setTitle(gig.title ?? "");
        setDescription(gig.description ?? "");
        setCategory(gig.category ?? "");
        setPrice(String(gig.price ?? ""));
        setDeliveryDays(String(gig.deliveryDays ?? ""));
        setTags(gig.tags ?? []);
        setImage(gig.image ?? null);
      })
      .catch(() => setError("Failed to load service."))
      .finally(() => setFetching(false));
  }, [gigId]);

  if (status === "unauthenticated") { router.push("/login"); return null; }
  if (fetching) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>Loading…</div>;

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleImageFile(file: File) {
    setImageUploading(true); setError("");
    const fd = new FormData(); fd.append("file", file);
    const res  = await fetch("/api/upload?type=gig", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? "Upload failed.");
    else setImage(json.url);
    setImageUploading(false);
  }

  async function handleSave() {
    setError("");
    if (!title.trim())       { setError("Title is required.");       return; }
    if (!category)           { setError("Select a category.");       return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (!price || parseInt(price) < 1)             { setError("Price must be at least $1.");       return; }
    if (!deliveryDays || parseInt(deliveryDays) < 1) { setError("Delivery days must be at least 1."); return; }
    setLoading(true);
    try {
      await updateGig(gigId, {
        title, description, category,
        price: parseInt(price),
        deliveryDays: parseInt(deliveryDays),
        tags, image,
      });
      router.push(`/gigs/${gigId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", padding: "clamp(1.5rem,5vw,2.5rem) 1rem 5rem", fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 6px" }}>Edit Service</p>
          <h1 style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Update your listing</h1>
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "clamp(1.2rem,4vw,2rem)", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Cover image */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>COVER IMAGE</label>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px" }}>Optional. JPEG, PNG or WebP, max 5 MB. Recommended 4:3 ratio.</p>
            {image ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Cover" style={{ width: "100%", maxWidth: 360, height: 180, objectFit: "cover", borderRadius: 10, border: "1px solid var(--card-border)", display: "block" }} />
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                  <label style={{ cursor: "pointer", background: "rgba(15,23,42,0.85)", color: "#e2e8f0", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7 }}>
                    Replace
                    <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                  </label>
                  <button type="button" onClick={() => setImage(null)} style={{ background: "rgba(239,68,68,0.85)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, border: "2px dashed var(--card-border)", borderRadius: 10, padding: "28px 20px", cursor: imageUploading ? "not-allowed" : "pointer", opacity: imageUploading ? 0.6 : 1 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{imageUploading ? "Uploading…" : "Click to upload cover image"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} disabled={imageUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>TITLE <span style={{ color: "#ef4444" }}>*</span></label>
            <input className="pg-input" style={{ width: "100%", boxSizing: "border-box" }} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. I will design your Web3 landing page" />
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>{title.length} / 80</div>
          </div>

          {/* Category */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>CATEGORY <span style={{ color: "#ef4444" }}>*</span></label>
            <select className="pg-input pg-select" style={{ width: "100%" }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category</option>
              {GIG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>SKILLS / TAGS</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SKILL_PRESETS.map((tag) => (
                <button key={tag} type="button" className={`pg-tag-pill${tags.includes(tag) ? " pg-tag-pill--active" : ""}`} onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>DESCRIPTION <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea className="pg-textarea" style={{ width: "100%", boxSizing: "border-box" }} rows={5} value={description} onChange={(e) => setDescription(e.target.value.slice(0, 600))} placeholder="Describe your service in detail…" />
            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>{description.length} / 600</div>
          </div>

          {/* Price + Delivery */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>PRICE <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="pg-input-affixed">
                <span className="pg-affix pg-affix--pre">$</span>
                <input className="pg-input pg-input--affixed-pre" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>DELIVERY <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="pg-input-affixed">
                <input className="pg-input pg-input--affixed-suf" type="number" min={1} value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} placeholder="7" />
                <span className="pg-affix pg-affix--suf">days</span>
              </div>
            </div>
          </div>

          {error && <div className="pg-error">{error}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button type="button" className="pg-btn-ghost" onClick={() => router.back()}>Cancel</button>
            <button type="button" className="pg-btn-publish" onClick={handleSave} disabled={loading || imageUploading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
