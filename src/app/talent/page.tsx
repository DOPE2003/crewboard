"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

export default function TalentPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const roleParam = searchParams.get("role");
  const selectedRole = roleParam ? decodeURIComponent(roleParam) : "All";

  useEffect(() => {
    fetch("/api/talent/browse")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = selectedRole === "All"
    ? users
    : users.filter((u) => u.userTitle === selectedRole);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <div className="mf-page-wide" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>

        <h1 className="mf-h1" style={{ marginBottom: 6 }}>
          Browse Profiles
        </h1>
        <p className="mf-body" style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Find the best Web3 talent for your project
        </p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontSize: 14 }}>
            Loading profiles…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)", fontSize: 14 }}>
            No profiles found.
          </div>
        ) : (
          <div className="mf-card-grid">
            {filtered.map((user) => (
              <ProfileCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
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

      {/* ── Media swiper (only if media exists) ── */}
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
              muted
              loop
              playsInline
              preload="metadata"
              controls
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

          {/* Nav arrows — only when multiple slides */}
          {user.media.length > 1 && (
            <>
              <button onClick={prev} style={arrowStyle("left")} aria-label="Previous">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button onClick={next} style={arrowStyle("right")} aria-label="Next">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>

              {/* Dot indicators */}
              <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 5 }}>
                {user.media.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); setSlide(i); }}
                    style={{
                      width: i === slide ? 16 : 6,
                      height: 6, borderRadius: 99,
                      background: i === slide ? "#14b8a6" : "rgba(255,255,255,0.5)",
                      border: "none", cursor: "pointer", padding: 0,
                      transition: "width 0.2s, background 0.2s",
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Media count badge */}
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

      {/* ── Card body — links to profile ── */}
      <a
        href={`/u/${user.twitterHandle}`}
        style={{ display: "flex", flexDirection: "column", gap: 0, padding: 18, textDecoration: "none", flex: 1 }}
      >
        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <UserAvatar src={user.image} name={user.name ?? user.twitterHandle} size={40} style={{ border: "2px solid var(--card-border)" }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name ?? user.twitterHandle}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>@{user.twitterHandle}</p>
          </div>
        </div>

        {/* Role pill */}
        {user.userTitle && (
          <span style={{
            display: "inline-block", fontSize: 11, fontWeight: 600,
            padding: "3px 10px", borderRadius: 99,
            background: "rgba(20,184,166,0.1)", color: "#0d9488", marginBottom: 8,
          }}>
            {user.userTitle}
          </span>
        )}

        {/* Bio */}
        {user.bio && (
          <p style={{
            fontSize: 12, color: "var(--text-muted)", margin: "0 0 10px 0",
            lineHeight: 1.55, overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {user.bio}
          </p>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {user.skills.slice(0, 3).map((skill) => (
              <span key={skill} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 99,
                background: "var(--card-bg)", border: "1px solid var(--card-border)",
                color: "var(--text-muted)", fontWeight: 500,
              }}>
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
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
  // Already a relative/public URL — return as-is
  if (url.startsWith("/") || url.startsWith("data:")) return url;
  return `/api/blob/serve?url=${encodeURIComponent(url)}`;
}

function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 28, height: 28,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    padding: 0,
  };
}
