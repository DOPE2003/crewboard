"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["Developer", "Designer", "Founder", "Marketer", "Other"];

const ROLE_SKILLS: Record<string, string[]> = {
  Developer: ["Solidity", "Rust", "Move", "TypeScript", "React", "Next.js", "Python", "Go", "Anchor", "Cairo"],
  Designer:  ["Figma", "UI/UX", "Branding", "Motion", "Web Design", "Prototyping", "Illustration", "3D"],
  Founder:   ["Product", "Strategy", "Fundraising", "Tokenomics", "Go-to-market", "Ops", "Legal", "DAO Governance"],
  Marketer:  ["Community", "Content", "Twitter/X", "KOL", "SEO", "Paid Ads", "Partnerships", "PR"],
  Other:     ["TypeScript", "React", "Python", "Research", "Data", "DevRel", "Moderation", "Support"],
};

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available", color: "rgba(120,255,180,0.8)" },
  { value: "open",      label: "Open to offers", color: "rgba(255,200,80,0.8)" },
  { value: "busy",      label: "Busy", color: "rgba(255,100,100,0.8)" },
];

interface Props {
  initialRole: string;
  initialSkills: string[];
  initialBio: string;
  initialAvailability: string;
}

export default function EditProfileForm({ initialRole, initialSkills, initialBio, initialAvailability }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const [role, setRole] = useState(initialRole);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [skillInput, setSkillInput] = useState("");
  const [bio, setBio] = useState(initialBio);
  const [availability, setAvailability] = useState(initialAvailability || "available");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function selectRole(r: string) {
    setRole(r);
    const nextPresets = ROLE_SKILLS[r] ?? [];
    setSkills((prev) => prev.filter((s) => nextPresets.includes(s)));
  }

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function addCustomSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.trim();
      if (!skills.includes(val)) setSkills((prev) => [...prev, val]);
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  function handleCancel() {
    setRole(initialRole);
    setSkills(initialSkills);
    setBio(initialBio);
    setAvailability(initialAvailability || "available");
    setError("");
    setIsEditing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError("Please select a role."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, skills, bio, availability }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const presets = role ? ROLE_SKILLS[role] ?? [] : [];

  if (!isEditing) {
    return (
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setIsEditing(true)}
      >
        Edit Profile
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ob-form" style={{ marginTop: 0 }}>
      <div className="dash-section-label" style={{ marginBottom: 12 }}>Edit Profile</div>

      {/* Role */}
      <div className="ob-field">
        <div className="dash-section-label">Role</div>
        <div className="ob-roles">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`ob-role-btn${role === r ? " ob-role-btn--active" : ""}`}
              onClick={() => selectRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="ob-field">
        <div className="dash-section-label">Skills</div>
        {role && (
          <div className="ob-skill-presets">
            {presets.map((s) => (
              <button
                key={s}
                type="button"
                className={`ob-skill-chip${skills.includes(s) ? " ob-skill-chip--active" : ""}`}
                onClick={() => toggleSkill(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <input
          className="ob-input"
          placeholder="Add custom skill (press Enter)"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={addCustomSkill}
        />
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

      {/* Bio */}
      <div className="ob-field">
        <div className="dash-section-label">Bio <span className="ob-char-count">{bio.length}/200</span></div>
        <textarea
          className="ob-textarea"
          placeholder="One or two sentences about what you build and what you're looking for."
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 200))}
          rows={3}
        />
      </div>

      {/* Availability */}
      <div className="ob-field">
        <div className="dash-section-label">Availability</div>
        <div className="ob-availability">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <label key={opt.value} className={`ob-avail-option${availability === opt.value ? " ob-avail-option--active" : ""}`}>
              <input
                type="radio"
                name="edit-availability"
                value={opt.value}
                checked={availability === opt.value}
                onChange={() => setAvailability(opt.value)}
                style={{ display: "none" }}
              />
              <span className="ob-avail-dot" style={{ background: opt.color, boxShadow: `0 0 6px ${opt.color}` }} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
          {loading ? "SAVING..." : "SAVE CHANGES"}
        </button>
        <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
}
