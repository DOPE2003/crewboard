"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface FloatProfile {
  name: string | null;
  twitterHandle: string;
  image: string | null;
  role: string | null;
  availability: string | null;
  skills: string[];
  bio: string | null;
}

interface Props {
  profiles: FloatProfile[];
}

const AVAIL_COLOR: Record<string, string> = {
  available: "#22c55e",
  open: "#f59e0b",
  busy: "#ef4444",
};

const AVAIL_LABEL: Record<string, string> = {
  available: "Available for work",
  open: "Open to offers",
  busy: "Busy",
};

function FloatCard({
  profile,
  style,
  animClass,
}: {
  profile: FloatProfile;
  style: React.CSSProperties;
  animClass: string;
}) {
  const router = useRouter();
  const color = AVAIL_COLOR[profile.availability ?? "available"] ?? "#22c55e";
  const label = AVAIL_LABEL[profile.availability ?? "available"] ?? "Available";
  const visibleSkills = profile.skills.slice(0, 3);

  return (
    <div
      onClick={() => router.push(`/u/${profile.twitterHandle}`)}
      className={`hero-float-card ${animClass}`}
      style={{ ...style, cursor: "pointer" }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        {profile.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.image}
            alt=""
            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.1)", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div className="hero-float-name" style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "0.88rem",
            color: "#000",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}>
            {profile.name ?? profile.twitterHandle}
          </div>
          {profile.role && (
            <div style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.5rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2DD4BF",
              fontWeight: 600,
              marginTop: 1,
            }}>
              {profile.role}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="hero-float-bio" style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "0.68rem",
          color: "rgba(0,0,0,0.5)",
          lineHeight: 1.5,
          margin: "0.5rem 0 0",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {profile.bio}
        </p>
      )}

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {visibleSkills.map((s) => (
            <span key={s} className="hero-float-chip" style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.48rem",
              padding: "0.2rem 0.5rem",
              borderRadius: 999,
              background: "rgba(0,0,0,0.05)",
              color: "rgba(0,0,0,0.5)",
              letterSpacing: "0.04em",
            }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Availability + DM row */}
      <div className="hero-float-divider" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.35rem",
        marginTop: "0.55rem",
        paddingTop: "0.5rem",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
          <span className="hero-float-avail" style={{ fontFamily: "Outfit, sans-serif", fontSize: "0.68rem", color: "rgba(0,0,0,0.5)", fontWeight: 500 }}>
            {label}
          </span>
        </div>
        <Link
          href={`/u/${profile.twitterHandle}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: "0.6rem", fontWeight: 700, fontFamily: "Rajdhani, sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 9px", borderRadius: 6,
            background: "#0f172a", color: "#fff", textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          DM
        </Link>
      </div>
    </div>
  );
}

export default function HeroFloatingProfiles({ profiles }: Props) {
  if (profiles.length < 2) return null;

  return (
    <>
      {/* Left column — 3 cards */}
      <FloatCard
        profile={profiles[0]}
        animClass="hero-float-1"
        style={{ position: "absolute", left: "clamp(1rem, 4vw, 4.5rem)", top: "16%", zIndex: 2 }}
      />
      <FloatCard
        profile={profiles[1]}
        animClass="hero-float-2"
        style={{ position: "absolute", left: "clamp(1rem, 4vw, 4.5rem)", top: "46%", zIndex: 2 }}
      />
      {profiles[4] && (
        <FloatCard
          profile={profiles[4]}
          animClass="hero-float-5"
          style={{ position: "absolute", left: "clamp(1rem, 4vw, 4.5rem)", top: "74%", zIndex: 2 }}
        />
      )}
      {/* Right column — 3 cards */}
      {profiles[2] && (
        <FloatCard
          profile={profiles[2]}
          animClass="hero-float-3"
          style={{ position: "absolute", right: "clamp(1rem, 4vw, 4.5rem)", top: "20%", zIndex: 2 }}
        />
      )}
      {profiles[3] && (
        <FloatCard
          profile={profiles[3]}
          animClass="hero-float-4"
          style={{ position: "absolute", right: "clamp(1rem, 4vw, 4.5rem)", top: "50%", zIndex: 2 }}
        />
      )}
      {profiles[5] && (
        <FloatCard
          profile={profiles[5]}
          animClass="hero-float-6"
          style={{ position: "absolute", right: "clamp(1rem, 4vw, 4.5rem)", top: "78%", zIndex: 2 }}
        />
      )}
    </>
  );
}
