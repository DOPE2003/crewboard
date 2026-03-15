"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { completeOnboarding } from "@/actions/onboarding";

const INTENTS = [
  {
    id: "work",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    label: "Offer my services",
    desc: "Post gigs, get hired by Web3 projects",
  },
  {
    id: "hire",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        <path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    label: "Hire talent",
    desc: "Find Web3 builders for your project",
  },
  {
    id: "build",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: "Build together",
    desc: "Find co-founders and collaborators",
  },
];

const ROLES = [
  "KOL Manager","Exchange Listings Manager","Web3 Web Designer",
  "Social Marketing","Artist","Video & Animation","Coding & Tech",
  "AI Engineer","Content Creator","Graphic & Design","Founder","Other",
];

const ROLE_SKILLS: Record<string, string[]> = {
  "KOL Manager":               ["KOL","Community","Twitter/X","Telegram","Discord","Influencer Marketing","Partnerships","PR"],
  "Exchange Listings Manager": ["Exchange Listings","Market Making","Tokenomics","Liquidity","CEX","DEX","Partnerships","Market Research"],
  "Web3 Web Designer":         ["Figma","UI/UX","Web Design","Prototyping","Web3 Design","Branding","CSS","Webflow"],
  "Social Marketing":          ["Community","Content","Twitter/X","Discord","Telegram","SEO","Paid Ads","PR","Growth"],
  "Artist":                    ["Illustration","NFT Art","Digital Art","3D","Motion","Branding","Character Design","Concept Art"],
  "Video & Animation":         ["Video Editing","Motion Graphics","After Effects","3D Animation","YouTube","TikTok","Premiere Pro","Blender"],
  "Coding & Tech":             ["Solidity","Rust","TypeScript","React","Next.js","Python","Go","Smart Contracts","Anchor","Cairo"],
  "AI Engineer":               ["Python","Machine Learning","LLMs","RAG","Fine-tuning","OpenAI","LangChain","Agents","Data Science"],
  "Content Creator":           ["Content Writing","Twitter/X","Copywriting","Research","Ghostwriting","Newsletters","Threads","Mirror.xyz"],
  "Graphic & Design":          ["Figma","Photoshop","Illustrator","Branding","Logo Design","UI/UX","Typography","Canva"],
  "Founder":                   ["Product","Strategy","Fundraising","Tokenomics","Go-to-market","Ops","DAO Governance","Legal"],
  "Other":                     ["Research","Data","DevRel","Moderation","Support","Operations","Community","QA"],
};

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available", color: "#22c55e" },
  { value: "open",      label: "Open to offers", color: "#f59e0b" },
  { value: "busy",      label: "Busy", color: "#ef4444" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Builder";

  const [step, setStep] = useState<0 | 1>(0);
  const [intent, setIntent] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState("available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectRole(r: string) {
    setRole(r);
    setSkills((prev) => prev.filter((s) => (ROLE_SKILLS[r] ?? []).includes(s)));
  }

  function toggleSkill(skill: string) {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  }

  function addCustomSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.trim();
      if (!skills.includes(val)) setSkills((prev) => [...prev, val]);
      setSkillInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError("Please select a role."); return; }
    if (!bio.trim()) { setError("Bio is required."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await completeOnboarding({ role, skills, bio, availability });
      if (result.ok) {
        await update({ profileComplete: true });
        router.push("/dashboard");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  const presets = role ? (ROLE_SKILLS[role] ?? []) : [];

  /* ─── STEP 0: Intent picker ─── */
  if (step === 0) {
    return (
      <main style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "160px 1.25rem 3rem",
      }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Greeting */}
          <h1 style={{
            fontSize: "1.6rem", fontWeight: 700, color: "#0f172a",
            marginBottom: "0.4rem", textAlign: "center",
          }}>
            {firstName}, what brings you to Crewboard?
          </h1>
          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#94a3b8", marginBottom: "2rem" }}>
            We&apos;ll personalise your experience based on your goal.
          </p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.75rem" }}>
            {INTENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntent(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1.1rem 1.25rem", borderRadius: 14,
                  border: intent === item.id
                    ? "2px solid #2DD4BF"
                    : "1.5px solid rgba(0,0,0,0.1)",
                  background: intent === item.id ? "rgba(45,212,191,0.05)" : "#fff",
                  cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  boxShadow: intent === item.id ? "0 0 0 4px rgba(45,212,191,0.08)" : "none",
                }}
              >
                <span style={{ color: intent === item.id ? "#2DD4BF" : "#64748b", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>{item.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>{item.desc}</div>
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!intent}
            onClick={() => setStep(1)}
            style={{
              width: "100%", padding: "0.85rem", borderRadius: 99, fontWeight: 700,
              fontSize: "0.82rem", letterSpacing: "0.08em", border: "none",
              background: intent ? "#0f172a" : "rgba(0,0,0,0.1)",
              color: intent ? "#fff" : "rgba(0,0,0,0.3)",
              cursor: intent ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
          >
            CONTINUE →
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.72rem", textDecoration: "underline" }}
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ─── STEP 1: Profile form ─── */
  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card ob-card">
          <div className="dash-badge">
            <span className="dash-badge-dot" />
            Step 2 of 2
          </div>
          <div className="auth-kicker">— CREWBOARD</div>
          <h1 className="auth-title">Set up your profile</h1>
          <p className="auth-sub">
            Tell the crew who you are. This is your public identity on Crewboard.
          </p>

          <form onSubmit={handleSubmit} className="ob-form">
            <div className="ob-field">
              <div className="dash-section-label">Your Role</div>
              <div className="ob-roles">
                {ROLES.map((r) => (
                  <button key={r} type="button"
                    className={`ob-role-btn${role === r ? " ob-role-btn--active" : ""}`}
                    onClick={() => selectRole(r)}>{r}</button>
                ))}
              </div>
            </div>

            {role && (
              <div className="ob-field">
                <div className="dash-section-label">Skills</div>
                <div className="ob-skill-presets">
                  {presets.map((s) => (
                    <button key={s} type="button"
                      className={`ob-skill-chip${skills.includes(s) ? " ob-skill-chip--active" : ""}`}
                      onClick={() => toggleSkill(s)}>{s}</button>
                  ))}
                </div>
                <input className="ob-input" placeholder="Add custom skill (press Enter)"
                  value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addCustomSkill} />
                {skills.length > 0 && (
                  <div className="ob-selected-skills">
                    {skills.map((s) => (
                      <span key={s} className="ob-selected-chip">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="ob-chip-remove">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="ob-field">
              <div className="dash-section-label">
                Bio <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
                <span className="ob-char-count"> {bio.length}/200</span>
              </div>
              <textarea className="ob-textarea" rows={3}
                placeholder="One or two sentences about what you build and what you're looking for."
                value={bio} onChange={(e) => setBio(e.target.value.slice(0, 200))} />
            </div>

            <div className="ob-field">
              <div className="dash-section-label">Availability</div>
              <div className="ob-availability">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`ob-avail-option${availability === opt.value ? " ob-avail-option--active" : ""}`}>
                    <input type="radio" name="availability" value={opt.value}
                      checked={availability === opt.value} onChange={() => setAvailability(opt.value)}
                      style={{ display: "none" }} />
                    <span className="ob-avail-dot" style={{ background: opt.color, boxShadow: `0 0 6px ${opt.color}` }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="button" onClick={() => setStep(0)}
                style={{ flex: "0 0 auto", padding: "0.75rem 1.25rem", borderRadius: 99, border: "1px solid rgba(0,0,0,0.12)", background: "transparent", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                ← Back
              </button>
              <button type="submit" className="btn-primary ob-submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? "SAVING..." : "LAUNCH MY PROFILE"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }
}
