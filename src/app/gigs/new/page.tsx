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

const SKILL_PRESETS = [
  "Solidity", "Smart Contracts", "UI/UX", "NFT", "DeFi",
  "React", "Web3.js", "Figma", "TypeScript", "Node.js",
  "IPFS", "Ethereum", "Polygon", "DAO", "Tokenomics",
  "Motion Design", "Copywriting", "Community", "Discord", "Twitter/X",
];

const STEPS = [
  { n: 1, label: "Gig Details",        sub: "Title, category & description" },
  { n: 2, label: "Pricing & Delivery", sub: "Set your rates & timeline" },
  { n: 3, label: "Publish",            sub: "Review & go live" },
];

const REVISION_OPTIONS = ["0", "1", "2", "3", "Unlimited"];

export default function NewGigPage() {
  const router = useRouter();
  const { status } = useSession();

  // form state
  const [step, setStep]               = useState(1);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [price, setPrice]             = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [revisions, setRevisions]     = useState("1");
  const [tags, setTags]               = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function validateStep1() {
    if (!title.trim())       { setError("Title is required.");       return false; }
    if (!category)           { setError("Select a category.");       return false; }
    if (!description.trim()) { setError("Description is required."); return false; }
    return true;
  }

  function validateStep2() {
    if (!price || parseInt(price) < 1)           { setError("Price must be at least $1.");       return false; }
    if (!deliveryDays || parseInt(deliveryDays) < 1) { setError("Delivery days must be at least 1."); return false; }
    return true;
  }

  function goNext() {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  }

  function goBack() {
    setError("");
    setStep((s) => s - 1);
  }

  async function handlePublish() {
    setError("");
    if (!validateStep1() || !validateStep2()) return;
    setLoading(true);
    try {
      const gig = await createGig({
        title,
        description,
        category,
        price: parseInt(price),
        deliveryDays: parseInt(deliveryDays),
        tags,
      });
      router.push(`/gigs/${gig.id}`);
    } catch (e: any) {
      setError(e.message ?? "Failed to create gig.");
    } finally {
      setLoading(false);
    }
  }

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <main className="pg-new-gig">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="pg-sidebar">
        <div className="pg-sidebar-inner">
          <div className="pg-sb-kicker">— CREWBOARD</div>
          <h1 className="pg-sb-title">Post a Gig</h1>
          <p className="pg-sb-sub">Offer your services to Web3 clients worldwide.</p>

          {/* Step indicators */}
          <div className="pg-steps">
            {STEPS.map((s, i) => {
              const active    = step === s.n;
              const completed = step > s.n;
              return (
                <div key={s.n} className="pg-step-row">
                  {/* connector line above (skip first) */}
                  {i > 0 && (
                    <div className={`pg-step-line${completed ? " pg-step-line--done" : ""}`} />
                  )}
                  <div className="pg-step-body">
                    <div className={`pg-step-circle${active ? " pg-step-circle--active" : ""}${completed ? " pg-step-circle--done" : ""}`}>
                      {completed ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : s.n}
                    </div>
                    <div className="pg-step-text">
                      <div className={`pg-step-label${active ? " pg-step-label--active" : ""}`}>{s.label}</div>
                      <div className="pg-step-sub">{s.sub}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pro Tip */}
          <div className="pg-pro-tip">
            <div className="pg-pro-tip-head">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="pg-pro-tip-title">Pro Tip</span>
            </div>
            <p className="pg-pro-tip-body">
              Gigs with clear titles and detailed descriptions get{" "}
              <strong>3x more</strong> client inquiries on Crewboard.
            </p>
          </div>
        </div>
      </aside>

      {/* ── MOBILE STEP DOTS ── */}
      <div className="pg-mobile-steps">
        {STEPS.map((s) => (
          <div key={s.n} className={`pg-mobile-dot${step === s.n ? " pg-mobile-dot--active" : ""}${step > s.n ? " pg-mobile-dot--done" : ""}`}>
            {step > s.n ? (
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : s.n}
          </div>
        ))}
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="pg-right">
        <div className="pg-card">

          {/* Card header */}
          <div className="pg-card-header">
            <div className="pg-card-title">
              Step {step} — {STEPS[step - 1].label}
            </div>
            <div className="pg-card-progress-wrap">
              <div className="pg-card-progress-bar">
                <div className="pg-card-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="pg-card-progress-label">{step} / 3</span>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="pg-step-form">

              <div className="pg-field">
                <label className="pg-label">TITLE <span className="pg-req">*</span></label>
                <p className="pg-helper">Start with &lsquo;I will&hellip;&rsquo; to keep it clear and action-oriented.</p>
                <input
                  className="pg-input"
                  placeholder="e.g. I will design your Web3 landing page"
                  value={title}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="pg-char-count">{title.length} / 80</div>
              </div>

              <div className="pg-field">
                <label className="pg-label">CATEGORY <span className="pg-req">*</span></label>
                <select
                  className="pg-input pg-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {GIG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pg-field">
                <label className="pg-label">SKILLS / TAGS</label>
                <p className="pg-helper">Select all that apply.</p>
                <div className="pg-tags-grid">
                  {SKILL_PRESETS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`pg-tag-pill${tags.includes(tag) ? " pg-tag-pill--active" : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pg-field">
                <label className="pg-label">DESCRIPTION <span className="pg-req">*</span></label>
                <p className="pg-helper">Describe what you offer, what the client gets, and any requirements.</p>
                <textarea
                  className="pg-textarea"
                  placeholder="Describe your service in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 600))}
                  rows={5}
                />
                <div className="pg-char-count">{description.length} / 600</div>
              </div>

              {error && <div className="pg-error">{error}</div>}

              <div className="pg-actions pg-actions--right">
                <button type="button" className="pg-btn-primary" onClick={goNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="pg-step-form">

              <div className="pg-field">
                <label className="pg-label">PRICE <span className="pg-req">*</span></label>
                <p className="pg-helper">Set your price in USD.</p>
                <div className="pg-input-affixed">
                  <span className="pg-affix pg-affix--pre">$</span>
                  <input
                    className="pg-input pg-input--affixed-pre"
                    type="number"
                    min={1}
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="pg-field">
                <label className="pg-label">DELIVERY TIME <span className="pg-req">*</span></label>
                <p className="pg-helper">How many days to deliver?</p>
                <div className="pg-input-affixed">
                  <input
                    className="pg-input pg-input--affixed-suf"
                    type="number"
                    min={1}
                    placeholder="e.g. 7"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                  />
                  <span className="pg-affix pg-affix--suf">days</span>
                </div>
              </div>

              <div className="pg-field">
                <label className="pg-label">REVISIONS</label>
                <select
                  className="pg-input pg-select"
                  value={revisions}
                  onChange={(e) => setRevisions(e.target.value)}
                >
                  {REVISION_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {error && <div className="pg-error">{error}</div>}

              <div className="pg-actions pg-actions--split">
                <button type="button" className="pg-btn-ghost" onClick={goBack}>
                  ← Back
                </button>
                <button type="button" className="pg-btn-primary" onClick={goNext}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="pg-step-form">
              <p className="pg-helper" style={{ marginBottom: 24 }}>
                Review your gig before publishing.
              </p>

              <div className="pg-summary">
                <div className="pg-summary-row">
                  <span className="pg-summary-key">Title</span>
                  <span className="pg-summary-val">{title || <em className="pg-summary-empty">—</em>}</span>
                </div>
                <div className="pg-summary-row">
                  <span className="pg-summary-key">Category</span>
                  <span className="pg-summary-val">{category || <em className="pg-summary-empty">—</em>}</span>
                </div>
                <div className="pg-summary-row">
                  <span className="pg-summary-key">Skills</span>
                  <span className="pg-summary-val">
                    {tags.length > 0
                      ? tags.map((t) => (
                          <span key={t} className="pg-summary-tag">{t}</span>
                        ))
                      : <em className="pg-summary-empty">None selected</em>}
                  </span>
                </div>
                <div className="pg-summary-row pg-summary-row--tall">
                  <span className="pg-summary-key">Description</span>
                  <span className="pg-summary-val pg-summary-desc">{description || <em className="pg-summary-empty">—</em>}</span>
                </div>
                <div className="pg-summary-row">
                  <span className="pg-summary-key">Price</span>
                  <span className="pg-summary-val">{price ? `$${price}` : <em className="pg-summary-empty">—</em>}</span>
                </div>
                <div className="pg-summary-row">
                  <span className="pg-summary-key">Delivery</span>
                  <span className="pg-summary-val">{deliveryDays ? `${deliveryDays} day${parseInt(deliveryDays) !== 1 ? "s" : ""}` : <em className="pg-summary-empty">—</em>}</span>
                </div>
                <div className="pg-summary-row">
                  <span className="pg-summary-key">Revisions</span>
                  <span className="pg-summary-val">{revisions}</span>
                </div>
              </div>

              {error && <div className="pg-error">{error}</div>}

              <div className="pg-actions pg-actions--split">
                <button type="button" className="pg-btn-ghost" onClick={goBack}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="pg-btn-publish"
                  onClick={handlePublish}
                  disabled={loading}
                >
                  {loading ? "Publishing..." : "Publish Gig"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
