"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { completeOnboarding, completeOnboardingAsClient } from "@/actions/onboarding";

const INTENTS = [
  {
    id: "hire",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        <path d="M11 8v6M8 11h6"/>
      </svg>
    ),
    label: "I want to hire",
    desc: "Post a job and find the right freelancer fast.",
  },
  {
    id: "work",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    label: "I want to offer services",
    desc: "Build a profile and get hired by projects.",
  },
  {
    id: "build",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: "Both — hire and work",
    desc: "Flexible: post jobs and offer your own services.",
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
  { value: "available", label: "Available now", color: "#22c55e" },
  { value: "open",      label: "Open to offers", color: "#f59e0b" },
  { value: "busy",      label: "Busy", color: "#94a3b8" },
];

const MIN_BIO = 20;

function ProgressBar({ step }: { step: 0 | 1 }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < 1 ? "none" : 1 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: i <= step ? "#14B8A6" : "var(--card-border)",
              color: i <= step ? "#fff" : "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              transition: "background 0.2s",
            }}>
              {i < step ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : i + 1}
            </div>
            {i < 1 && (
              <div style={{ flex: 1, height: 2, borderRadius: 99, background: step > 0 ? "#14B8A6" : "var(--card-border)", transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: step >= 0 ? "#14B8A6" : "var(--text-muted)", fontWeight: 600 }}>Your goal</span>
        <span style={{ fontSize: 10, color: step >= 1 ? "#14B8A6" : "var(--text-muted)", fontWeight: 600 }}>Your profile</span>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();

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

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  function addCustomSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.trim();
      if (!skills.includes(val)) setSkills((prev) => [...prev, val]);
      setSkillInput("");
    }
  }

  async function handleContinue() {
    if (!intent) return;
    if (intent === "hire") {
      setLoading(true);
      setError("");
      try {
        await completeOnboardingAsClient();
        await update({ profileComplete: true });
        router.push("/jobs/new");
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
        setLoading(false);
      }
    } else {
      setStep(1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError("Please select a role."); return; }
    if (skills.length === 0) { setError("Please add at least 1 skill."); return; }
    if (!bio.trim()) { setError("Please write a short bio."); return; }
    if (bio.trim().length < MIN_BIO) { setError(`Bio must be at least ${MIN_BIO} characters.`); return; }
    setLoading(true);
    setError("");
    try {
      await completeOnboarding({ role, skills, bio, availability });
      await update({ profileComplete: true });
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
      setLoading(false);
    }
  }

  const presets = role ? (ROLE_SKILLS[role] ?? []) : [];
  const bioOk = bio.trim().length >= MIN_BIO;

  /* ─── STEP 0: Intent picker ─── */
  if (step === 0) {
    return (
      <main style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "clamp(90px, 15vh, 140px) 1.25rem 3rem",
      }}>
        <div style={{ width: "100%", maxWidth: 460 }}>

          <ProgressBar step={0} />

          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.3rem" }}>
            What brings you here?
          </h1>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
            We&apos;ll set you up based on your goal. Takes under a minute.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
            {INTENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntent(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  padding: "0.875rem 1rem", borderRadius: 12,
                  border: intent === item.id ? "2px solid #14B8A6" : "1.5px solid var(--card-border)",
                  background: intent === item.id ? "rgba(20,184,166,0.05)" : "var(--surface)",
                  cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  boxShadow: intent === item.id ? "0 0 0 3px rgba(20,184,166,0.1)" : "none",
                }}
              >
                <span style={{ color: intent === item.id ? "#14B8A6" : "var(--text-muted)", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground)", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</div>
                </span>
              </button>
            ))}
          </div>

          {error && <p style={{ fontSize: "0.82rem", color: "#ef4444", marginBottom: 12 }}>{error}</p>}

          <button
            type="button"
            disabled={!intent || loading}
            onClick={handleContinue}
            style={{
              width: "100%", padding: "0.8rem", borderRadius: 10, fontWeight: 600,
              fontSize: "0.9rem", letterSpacing: "-0.01em", border: "none",
              background: intent && !loading ? "#14B8A6" : "var(--card-border)",
              color: intent && !loading ? "#fff" : "var(--text-muted)",
              cursor: intent && !loading ? "pointer" : "not-allowed",
              transition: "background 0.18s",
              boxShadow: intent ? "0 2px 10px rgba(20,184,166,0.28)" : "none",
            }}
          >
            {loading ? "Setting up…" : intent === "hire" ? "Continue to post a job →" : "Continue →"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.72rem" }}
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
    <main style={{
      minHeight: "100vh", display: "flex", justifyContent: "center",
      padding: "clamp(90px, 12vh, 120px) 1.25rem 3rem",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        <ProgressBar step={1} />

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", marginBottom: "0.3rem" }}>
          Set up your profile
        </h1>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.75rem", lineHeight: 1.6 }}>
          This is your public identity on Crewboard. Keep it honest and specific.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Role */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
              Your role
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {ROLES.map((r) => (
                <button key={r} type="button"
                  onClick={() => selectRole(r)}
                  style={{
                    padding: "6px 14px", borderRadius: 99, cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
                    border: role === r ? "1.5px solid #14B8A6" : "1.5px solid var(--card-border)",
                    background: role === r ? "#14B8A6" : "var(--surface)",
                    color: role === r ? "#fff" : "var(--foreground)",
                    transition: "all 0.15s",
                  }}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Skills */}
          {role && (
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
                Skills <span style={{ color: "#ef4444" }}>*</span>
                {skills.length > 0 && <span style={{ color: "#14B8A6", marginLeft: 6 }}>{skills.length} selected</span>}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: 8 }}>
                {presets.map((s) => (
                  <button key={s} type="button"
                    onClick={() => toggleSkill(s)}
                    style={{
                      padding: "5px 12px", borderRadius: 99, cursor: "pointer", fontSize: "0.78rem", fontWeight: 500,
                      border: skills.includes(s) ? "1.5px solid #14B8A6" : "1.5px solid var(--card-border)",
                      background: skills.includes(s) ? "rgba(20,184,166,0.1)" : "var(--surface)",
                      color: skills.includes(s) ? "#0d9488" : "var(--text-muted)",
                      transition: "all 0.15s",
                    }}
                  >{s}</button>
                ))}
              </div>
              <input
                placeholder="Add custom skill (press Enter)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={addCustomSkill}
                style={{
                  width: "100%", height: 40, padding: "0 12px", borderRadius: 9,
                  border: "1px solid var(--card-border)", background: "var(--background)",
                  color: "var(--foreground)", fontSize: "0.82rem", outline: "none",
                  fontFamily: "inherit",
                }}
              />
              {skills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: 8 }}>
                  {skills.map((s) => (
                    <span key={s} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 10px 3px 10px", borderRadius: 99,
                      background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)",
                      color: "#0d9488", fontSize: "0.78rem", fontWeight: 500,
                    }}>
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#0d9488", lineHeight: 1, fontSize: 14, display: "flex" }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          <div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
              <span>Bio <span style={{ color: "#ef4444" }}>*</span></span>
              <span style={{ fontWeight: 400, color: bioOk ? "#14B8A6" : "var(--text-muted)" }}>
                {bio.length}/200 {!bioOk && bio.length > 0 ? `(min ${MIN_BIO})` : ""}
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="What do you do and what kind of work are you looking for? Be specific."
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 9,
                border: `1px solid ${bio.length > 0 && !bioOk ? "#f59e0b" : "var(--card-border)"}`,
                background: "var(--background)", color: "var(--foreground)",
                fontSize: "0.875rem", lineHeight: 1.6, outline: "none",
                fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Availability */}
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>
              Availability
            </label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <label key={opt.value} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "7px 14px", borderRadius: 99, cursor: "pointer",
                  border: availability === opt.value ? `1.5px solid ${opt.color}` : "1.5px solid var(--card-border)",
                  background: availability === opt.value ? `${opt.color}15` : "var(--surface)",
                  fontSize: "0.82rem", fontWeight: 500, color: "var(--foreground)",
                  transition: "all 0.15s",
                }}>
                  <input type="radio" name="availability" value={opt.value}
                    checked={availability === opt.value} onChange={() => setAvailability(opt.value)}
                    style={{ display: "none" }} />
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p style={{ fontSize: "0.82rem", color: "#ef4444", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
            <button type="button" onClick={() => setStep(0)}
              style={{
                flexShrink: 0, padding: "0.75rem 1.125rem", borderRadius: 9,
                border: "1.5px solid var(--card-border)", background: "transparent",
                cursor: "pointer", fontSize: "0.82rem", fontWeight: 500,
                color: "var(--text-muted)", transition: "border-color 0.15s",
              }}>
              ← Back
            </button>
            <button type="submit" disabled={loading}
              style={{
                flex: 1, padding: "0.8rem", borderRadius: 10, border: "none",
                background: loading ? "var(--card-border)" : "#14B8A6",
                color: loading ? "var(--text-muted)" : "#fff",
                fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.01em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.18s",
                boxShadow: loading ? "none" : "0 2px 10px rgba(20,184,166,0.28)",
              }}>
              {loading ? "Saving…" : "Launch my profile →"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
