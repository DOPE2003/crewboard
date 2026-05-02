"use client";

import { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/ui/UserAvatar";

type MediaItem = { mediaUrl: string; mediaType: string; title: string };

type User = {
  id: string;
  name: string | null;
  twitterHandle: string | null;
  image: string | null;
  userTitle: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
  minPrice: number | null;
  media: MediaItem[];
};

const ROLES = [
  "All",
  "AI Engineer",
  "Smart Contract Dev",
  "Frontend Dev",
  "Backend Dev",
  "Full Stack Dev",
  "Designer",
  "Content Creator",
  "Community Manager",
  "Marketing",
  "Other",
];

export default function TalentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("All");
  const [skillSearch, setSkillSearch] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    fetch("/api/talent/browse")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const q = skillSearch.toLowerCase().trim();

  const filtered = users.filter((u) => {
    const matchesRole = selectedRole === "All" || u.userTitle === selectedRole;
    const matchesSkill = !q || u.skills.some((s) => s.toLowerCase().includes(q)) ||
      (u.userTitle ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q);
    const matchesAvail = !availableOnly || u.availability === "available";
    return matchesRole && matchesSkill && matchesAvail;
  });

  const hasFilters = selectedRole !== "All" || q || availableOnly;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <div className="mf-page-wide" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>

        <h1 className="mf-h1" style={{ marginBottom: 4 }}>Browse Talent</h1>
        <p className="mf-body" style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>
          Find the best Web3 freelancers for your project
        </p>

        {/* ── Filter bar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>

          {/* Search + availability row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Skill search */}
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 200, maxWidth: 360 }}>
              <svg
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search by skill, name…"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 9, border: "1px solid var(--card-border)",
                  background: "var(--dropdown-bg)", color: "var(--foreground)",
                  fontSize: "0.82rem", outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Available toggle */}
            <button
              onClick={() => setAvailableOnly((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "7px 14px", borderRadius: 9, fontSize: "0.78rem", fontWeight: 600,
                border: `1px solid ${availableOnly ? "#22c55e" : "var(--card-border)"}`,
                background: availableOnly ? "rgba(34,197,94,0.1)" : "transparent",
                color: availableOnly ? "#22c55e" : "var(--text-muted)",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: availableOnly ? "#22c55e" : "var(--card-border)",
                transition: "background 0.12s",
              }} />
              Available now
            </button>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={() => { setSelectedRole("All"); setSkillSearch(""); setAvailableOnly(false); }}
                style={{
                  padding: "7px 12px", borderRadius: 9, fontSize: "0.75rem",
                  border: "1px solid var(--card-border)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Role chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ROLES.map((role) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  style={{
                    padding: "5px 14px", borderRadius: 99, fontSize: "0.75rem", fontWeight: 600,
                    border: `1px solid ${active ? "#14B8A6" : "var(--card-border)"}`,
                    background: active ? "rgba(20,184,166,0.12)" : "transparent",
                    color: active ? "#0d9488" : "var(--text-muted)",
                    cursor: "pointer", transition: "all 0.12s",
                  }}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        {hasFilters && !loading && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 16 }}>
            {filtered.length} freelancer{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: 16, background: "var(--surface)", border: "1px solid var(--card-border)", height: 260, animation: "pulse 1.5s ease-in-out infinite", opacity: 0.6 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(20,184,166,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", margin: "0 0 6px" }}>
              No freelancers match
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 20px", lineHeight: 1.6, maxWidth: 280, marginInline: "auto" }}>
              Try adjusting your filters or browsing all categories.
            </p>
            <button
              onClick={() => { setSelectedRole("All"); setSkillSearch(""); setAvailableOnly(false); }}
              style={{ fontSize: "0.82rem", fontWeight: 600, color: "#14B8A6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mf-card-grid">
            {filtered.map((user) => (
              <ProfileCard key={user.id} user={user} searchQ={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ user, searchQ }: { user: User; searchQ: string }) {
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const hasMedia = user.media.length > 0;

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    setSlide((s) => (s - 1 + user.media.length) % user.media.length);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault();
    setSlide((s) => (s + 1) % user.media.length);
  }
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) setSlide((s) => dx < 0
      ? (s + 1) % user.media.length
      : (s - 1 + user.media.length) % user.media.length
    );
    touchStartX.current = null;
  }

  const current = user.media[slide];

  return (
    <div style={{
      background: "var(--card-bg)",
      border: "1px solid var(--card-border)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Media swiper ── */}
      {hasMedia && (
        <div
          style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0f172a", overflow: "hidden", flexShrink: 0 }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {current.mediaType === "video" ? (
            <video
              key={current.mediaUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              muted loop playsInline preload="metadata" controls
              onMouseEnter={(e) => { (e.currentTarget as HTMLVideoElement).play().catch(() => {}); }}
              onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
            >
              <source src={proxy(current.mediaUrl)} type="video/mp4" />
              <source src={proxy(current.mediaUrl)} type="video/webm" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.mediaUrl}
              src={proxy(current.mediaUrl)}
              alt={current.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}

          {user.media.length > 1 && (
            <>
              <button onClick={prev} style={arrowStyle("left")} aria-label="Previous">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={next} style={arrowStyle("right")} aria-label="Next">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                {user.media.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); setSlide(i); }}
                    style={{
                      width: i === slide ? 16 : 6, height: 6, borderRadius: 99,
                      background: i === slide ? "#14b8a6" : "rgba(255,255,255,0.5)",
                      border: "none", cursor: "pointer", padding: 0,
                      transition: "width 0.2s, background 0.2s",
                    }}
                  />
                ))}
              </div>
            </>
          )}

          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
            borderRadius: 99, padding: "2px 8px",
            fontSize: 11, fontWeight: 600, color: "white",
          }}>
            {slide + 1}/{user.media.length}
          </div>
        </div>
      )}

      {/* ── Card body ── */}
      <a
        href={`/u/${user.twitterHandle}`}
        style={{ display: "flex", flexDirection: "column", gap: 0, padding: 18, textDecoration: "none", flex: 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <UserAvatar src={user.image} name={user.name ?? user.twitterHandle} size={40} style={{ border: "2px solid var(--card-border)" }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name ?? user.twitterHandle}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>@{user.twitterHandle}</p>
          </div>
        </div>

        {user.userTitle && (
          <span style={{
            display: "inline-block", fontSize: 11, fontWeight: 600,
            padding: "3px 10px", borderRadius: 99,
            background: "rgba(20,184,166,0.1)", color: "#0d9488", marginBottom: 8,
          }}>
            {user.userTitle}
          </span>
        )}

        {user.bio && (
          <p style={{
            fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px 0",
            lineHeight: 1.55, overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {user.bio}
          </p>
        )}

        {/* Skills — highlight matched skill */}
        {user.skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {user.skills.slice(0, 4).map((skill) => {
              const match = searchQ && skill.toLowerCase().includes(searchQ);
              return (
                <span key={skill} style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 99,
                  background: match ? "rgba(20,184,166,0.15)" : "var(--card-bg)",
                  border: `1px solid ${match ? "rgba(20,184,166,0.4)" : "var(--card-border)"}`,
                  color: match ? "#0d9488" : "var(--text-muted)",
                  fontWeight: match ? 700 : 500,
                  transition: "all 0.1s",
                }}>
                  {skill}
                </span>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--card-border)", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: user.availability === "available" ? "#22c55e" : "#9ca3af",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {user.availability === "available" ? "Available" : "Unavailable"}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: user.minPrice != null ? "#14B8A6" : "var(--text-muted)" }}>
            {user.minPrice != null ? `from $${user.minPrice}` : "Price on request"}
          </span>
        </div>
      </a>
    </div>
  );
}

function proxy(url: string): string {
  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  return `/api/blob/serve?url=${encodeURIComponent(url)}`;
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", [side]: 8,
    transform: "translateY(-50%)",
    width: 28, height: 28, borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2, padding: 0,
  };
}
