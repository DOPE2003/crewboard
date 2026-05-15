"use client";

import { useState, useEffect, useRef } from "react";
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
  ordersCompleted: number;
  totalEarned: number;
  memberSince: string;
  isDemo?: boolean;
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

const POSITIONS: React.CSSProperties[] = [
  { position: "absolute", top: "16%", left:  "2%", zIndex: 10 },
  { position: "absolute", top: "46%", left:  "4%", zIndex: 11 },
  { position: "absolute", top: "74%", left:  "2%", zIndex: 12 },
  { position: "absolute", top: "16%", right: "2%", zIndex: 10 },
  { position: "absolute", top: "46%", right: "4%", zIndex: 11 },
  { position: "absolute", top: "74%", right: "2%", zIndex: 12 },
];

const ANIM_CLASSES = [
  "hero-float-1", "hero-float-2", "hero-float-3",
  "hero-float-4", "hero-float-5", "hero-float-6",
];

// Fallback demo profiles — used only when DB has fewer than 6 real users.
// Avatars from pravatar.cc (stable, realistic human faces, no auth required).
const FALLBACK_PROFILES: FloatProfile[] = [
  {
    name: "Alex Rivera",
    twitterHandle: "alexrivera_dev",
    image: "https://i.pravatar.cc/150?img=11",
    role: "Full-Stack Developer",
    availability: "available",
    skills: ["React", "Node.js", "TypeScript"],
    bio: "Building scalable web3 apps and DeFi protocols.",
    ordersCompleted: 47,
    totalEarned: 18500,
    memberSince: "Jan 2024",
    isDemo: true,
  },
  {
    name: "Mia Chen",
    twitterHandle: "mia_designs",
    image: "https://i.pravatar.cc/150?img=47",
    role: "UI/UX Designer",
    availability: "open",
    skills: ["Figma", "Branding", "Motion"],
    bio: "Crafting beautiful, conversion-focused interfaces.",
    ordersCompleted: 31,
    totalEarned: 11200,
    memberSince: "Mar 2024",
    isDemo: true,
  },
  {
    name: "Jordan Blake",
    twitterHandle: "jblake_web3",
    image: "https://i.pravatar.cc/150?img=33",
    role: "Smart Contract Dev",
    availability: "available",
    skills: ["Solidity", "Rust", "Auditing"],
    bio: "Audited 40+ contracts. Zero exploits.",
    ordersCompleted: 62,
    totalEarned: 34000,
    memberSince: "Nov 2023",
    isDemo: true,
  },
  {
    name: "Layla Hassan",
    twitterHandle: "layla_creates",
    image: "https://i.pravatar.cc/150?img=56",
    role: "Content Strategist",
    availability: "available",
    skills: ["Copywriting", "SEO", "Web3"],
    bio: "Turning complex protocols into compelling stories.",
    ordersCompleted: 28,
    totalEarned: 7800,
    memberSince: "Feb 2024",
    isDemo: true,
  },
  {
    name: "Sam Torres",
    twitterHandle: "samueldesigns",
    image: "https://i.pravatar.cc/150?img=15",
    role: "Motion Designer",
    availability: "open",
    skills: ["After Effects", "Lottie", "Rive"],
    bio: "Bringing brands to life with premium animation.",
    ordersCompleted: 19,
    totalEarned: 9400,
    memberSince: "Apr 2024",
    isDemo: true,
  },
  {
    name: "Nina Park",
    twitterHandle: "ninapark_ai",
    image: "https://i.pravatar.cc/150?img=44",
    role: "AI Engineer",
    availability: "available",
    skills: ["LLMs", "Python", "RAG"],
    bio: "Shipping production AI features, not demos.",
    ordersCompleted: 35,
    totalEarned: 21000,
    memberSince: "Dec 2023",
    isDemo: true,
  },
  {
    name: "Kai Okonkwo",
    twitterHandle: "kai_blockchain",
    image: "https://i.pravatar.cc/150?img=68",
    role: "DeFi Architect",
    availability: "open",
    skills: ["Uniswap v4", "EVM", "Foundry"],
    bio: "Built AMM infrastructure handling $50M+ TVL.",
    ordersCompleted: 22,
    totalEarned: 29000,
    memberSince: "Oct 2023",
    isDemo: true,
  },
  {
    name: "Zoe Mitchell",
    twitterHandle: "zoemitch_brand",
    image: "https://i.pravatar.cc/150?img=25",
    role: "Brand Designer",
    availability: "available",
    skills: ["Identity", "Figma", "Illustration"],
    bio: "Visual identity for 15+ crypto projects.",
    ordersCompleted: 41,
    totalEarned: 15600,
    memberSince: "Jan 2024",
    isDemo: true,
  },
];

function fillSlots(real: FloatProfile[]): FloatProfile[] {
  if (real.length >= 6) return real.slice(0, 8); // pass up to 8 for rotation variety
  // Pad with fallbacks that aren't already represented by handle
  const realHandles = new Set(real.map((p) => p.twitterHandle));
  const extra = FALLBACK_PROFILES.filter((p) => !realHandles.has(p.twitterHandle));
  const merged = [...real, ...extra];
  return merged.slice(0, Math.max(8, merged.length));
}

function FloatCard({ profile, style, animClass, fading }: {
  profile: FloatProfile;
  style: React.CSSProperties;
  animClass: string;
  fading: boolean;
}) {
  const router = useRouter();
  const color = AVAIL_COLOR[profile.availability ?? "available"] ?? "#22c55e";
  const label = AVAIL_LABEL[profile.availability ?? "available"] ?? "Available";
  const visibleSkills = profile.skills.slice(0, 3);
  const profileHref = profile.isDemo ? "/talent" : `/u/${profile.twitterHandle}`;

  return (
    <div
      style={{
        ...style,
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
        pointerEvents: "auto",
      }}
    >
      <div
        onClick={() => router.push(profileHref)}
        className={`hero-float-card ${animClass}`}
        style={{ cursor: "pointer" }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {profile.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.image}
              alt=""
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              onError={(e) => { e.currentTarget.style.display = "none" }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #14B8A6, #0f766e)",
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "0.8rem", fontFamily: "Inter, sans-serif",
            }}>
              {(profile.name ?? profile.twitterHandle).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="hero-float-name" style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "#000",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 160,
            }}>
              {profile.name ?? profile.twitterHandle}
            </div>
            {profile.role && (
              <div style={{
                fontFamily: "Inter, sans-serif",
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
            fontFamily: "Inter, sans-serif",
            fontSize: "0.68rem",
            color: "var(--text-muted)",
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
                fontFamily: "Inter, sans-serif",
                fontSize: "0.48rem",
                padding: "0.2rem 0.5rem",
                borderRadius: 999,
                background: "rgba(0,0,0,0.05)",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Proof-of-work stats */}
        {(() => {
          const hasStats = profile.ordersCompleted > 0 || profile.totalEarned > 0;
          const earnedStr = profile.totalEarned >= 1000
            ? `$${(profile.totalEarned / 1000).toFixed(profile.totalEarned % 1000 === 0 ? 0 : 1)}k`
            : `$${profile.totalEarned}`;
          const stats = [
            ...(hasStats ? [
              { label: "Orders", val: String(profile.ordersCompleted) },
              { label: "Earned", val: earnedStr },
            ] : []),
            { label: "Since", val: profile.memberSince },
          ];
          return (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {stats.map((stat, i) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  {i > 0 && <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.5rem", color: "rgba(0,0,0,0.15)", marginTop: 8 }}>·</span>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.42rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,0,0,0.28)" }}>{stat.label}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", fontWeight: 700, color: "#2DD4BF" }}>{stat.val}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Availability + actions row */}
        <div className="hero-float-divider" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.35rem",
          marginTop: "0.55rem",
          paddingTop: "0.5rem",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          flexWrap: "nowrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", minWidth: 0, overflow: "hidden" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span className="hero-float-avail" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {label}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="hero-float-view"
              style={{ fontSize: "0.6rem", fontFamily: "Inter, sans-serif", color: "var(--text-muted)", textDecoration: "none" }}
            >
              View profile
            </Link>
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: "0.6rem", fontWeight: 700, fontFamily: "Inter, sans-serif",
                letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "3px 9px", borderRadius: 6,
                background: "#0f172a", color: "#fff", textDecoration: "none",
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {profile.isDemo ? "Explore" : "DM"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroFloatingProfiles({ profiles }: Props) {
  const pool = fillSlots(profiles);
  const initial = pool.slice(0, 6);

  const [slots, setSlots] = useState<FloatProfile[]>(initial);
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);
  const slotsRef = useRef<FloatProfile[]>(initial);
  const poolRef = useRef<FloatProfile[]>(pool);

  // Keep pool ref in sync if profiles prop changes
  useEffect(() => {
    poolRef.current = fillSlots(profiles);
  }, [profiles]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentPool = poolRef.current;
      if (currentPool.length < 2) return;

      const slotIdx = Math.floor(Math.random() * 6);
      const displayedHandles = new Set(slotsRef.current.map((p) => p.twitterHandle));
      const candidates = currentPool.filter((p) => !displayedHandles.has(p.twitterHandle));
      if (candidates.length === 0) return;

      const next = candidates[Math.floor(Math.random() * candidates.length)];
      setFadingSlot(slotIdx);

      setTimeout(() => {
        setSlots((prev) => {
          const updated = [...prev];
          updated[slotIdx] = next;
          slotsRef.current = updated;
          return updated;
        });
        setFadingSlot(null);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-float-wrapper">
      {slots.map((profile, i) => (
        <FloatCard
          key={i}
          profile={profile}
          animClass={ANIM_CLASSES[i]}
          style={POSITIONS[i]}
          fading={fadingSlot === i}
        />
      ))}
    </div>
  );
}
