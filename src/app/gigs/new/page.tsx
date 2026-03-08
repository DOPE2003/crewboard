"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createGig } from "@/actions/gigs";

const GIG_CATEGORIES = [
  "KOL Manager",
  "Exchange Listings Manager",
  "Web3 Web Designer",
  "Social Marketing",
  "Artist",
  "Video & Animation",
  "Coding & Tech",
  "AI Engineer",
  "Content Creator",
  "Graphic & Design",
];

export default function NewGigPage() {
  const router = useRouter();
  const { status } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const val = tagInput.trim();
      if (!tags.includes(val)) setTags((prev) => [...prev, val]);
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim())    { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (!category)        { setError("Select a category."); return; }
    if (!price || parseInt(price) < 1) { setError("Price must be at least $1."); return; }
    if (!deliveryDays || parseInt(deliveryDays) < 1) { setError("Delivery days must be at least 1."); return; }

    setLoading(true);
    try {
      const gig = await createGig({
        title,
        description,
        category,
        price: parseInt(price),
        deliveryDays: parseInt(deliveryDays),
        tags
      });
      router.push(`/gigs/${gig.id}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to create gig.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card ob-card">
          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title">Post a Gig</h1>
          <p className="auth-sub">Offer your services to Web3 clients.</p>

          <form onSubmit={handleSubmit} className="ob-form">

            <div className="ob-field">
              <div className="dash-section-label">Title <span style={{ color: "#ef4444" }}>*</span></div>
              <input
                className="ob-input"
                placeholder="e.g. I will design your Web3 landing page"
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="ob-char-count" style={{ textAlign: "right", marginTop: 4 }}>{title.length}/80</div>
            </div>

            <div className="ob-field">
              <div className="dash-section-label">Category <span style={{ color: "#ef4444" }}>*</span></div>
              <select
                className="ob-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">Select a category</option>
                {GIG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="ob-field">
              <div className="dash-section-label">Description <span style={{ color: "#ef4444" }}>*</span></div>
              <textarea
                className="ob-textarea"
                placeholder="Describe what you offer, what the client gets, and any requirements."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 600))}
                rows={4}
              />
              <div className="ob-char-count" style={{ textAlign: "right", marginTop: 4 }}>{description.length}/600</div>
            </div>

            <div className="ob-field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div className="dash-section-label">Price (USD) <span style={{ color: "#ef4444" }}>*</span></div>
                <input
                  className="ob-input"
                  type="number"
                  min={1}
                  placeholder="e.g. 150"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <div className="dash-section-label">Delivery (days) <span style={{ color: "#ef4444" }}>*</span></div>
                <input
                  className="ob-input"
                  type="number"
                  min={1}
                  placeholder="e.g. 7"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                />
              </div>
            </div>

            <div className="ob-field">
              <div className="dash-section-label">Tags / Skills</div>
              <input
                className="ob-input"
                placeholder="Add a tag and press Enter (e.g. Solidity, Figma)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div className="ob-selected-skills" style={{ marginTop: 8 }}>
                  {tags.map((t) => (
                    <span key={t} className="ob-selected-chip">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="ob-chip-remove">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn-primary ob-submit" disabled={loading}>
              {loading ? "POSTING..." : "PUBLISH GIG"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
