"use client";

import { useState, useRef } from "react";
import { saveProfileAction, sendHireMessage } from "@/actions/talent";
import { Bookmark, MessageCircle } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  image: string | null;
  bannerImage: string | null;
  role: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
  twitterHandle: string;
  isOG: boolean;
  walletAddress: string | null;
  ordersCompleted: number;
  totalEarned: number;
  avgRating: number | null;
  reviewCount: number;
  createdAt?: string | Date;
}

function initials(p: Profile) {
  const src = p.name ?? p.twitterHandle ?? "";
  return src.slice(0, 2).toUpperCase() || "??";
}

// ── Shared new card design (Variation C) ─────────────────────────────────────
function CardInner({ profile }: { profile: Profile }) {
  return (
    <>
      {/* TOP — Teal header 30% */}
      <div style={{ height: "30%", background: "#14B8A6", position: "relative", overflow: "visible", flexShrink: 0 }}>
        {/* Circle texture */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }}
          viewBox="0 0 200 90"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="160" cy="15" r="60" fill="white" />
          <circle cx="30" cy="70" r="45" fill="white" />
          <circle cx="120" cy="80" r="35" fill="white" />
        </svg>

        {/* Role pill — top left */}
        <div style={{
          position: "absolute", top: 12, left: 16,
          background: "rgba(255,255,255,0.2)", color: "white",
          borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 500,
        }}>
          {profile.role ?? "Web3 Builder"}
        </div>

        {/* Availability — top right */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "rgba(255,255,255,0.2)", color: "white",
          borderRadius: 99, padding: "3px 10px", fontSize: 10,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%", display: "inline-block",
            background: profile.availability === "available" ? "#22c55e" : "rgba(255,255,255,0.45)",
          }} />
          {profile.availability === "available" ? "Available" : "Unavailable"}
        </div>

        {/* Avatar — overlaps header bottom */}
        <div style={{
          position: "absolute", bottom: -36, left: 20,
          width: 72, height: 72, borderRadius: "50%",
          border: "4px solid white",
          backgroundColor: profile.image ? "white" : "#14B8A6",
          backgroundImage: profile.image ? `url(${profile.image})` : "none",
          backgroundSize: "cover", backgroundPosition: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {!profile.image && (
            <span style={{ fontSize: 24, color: "white", fontWeight: 600 }}>
              {initials(profile)}
            </span>
          )}
        </div>
      </div>

      {/* BOTTOM — Content 70% */}
      <div style={{
        flex: 1, padding: "44px 18px 16px",
        display: "flex", flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        background: "var(--background)",
        position: "relative", zIndex: 1,
      }}>
        {/* Name + badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20, fontWeight: 500, color: "var(--foreground)" }}>
            {profile.name ?? profile.twitterHandle}
          </span>
          {profile.isOG && (
            <span style={{ background: "#f59e0b", color: "white", borderRadius: 99, padding: "2px 7px", fontSize: 9, fontWeight: 500 }}>OG</span>
          )}
          {profile.walletAddress && (
            <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 99, padding: "2px 7px", fontSize: 9 }}>✓</span>
          )}
        </div>

        {/* Meta */}
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
          @{profile.twitterHandle} · Solana{profile.createdAt ? ` · ${new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}
        </p>

        {/* Bio — quote style */}
        <div style={{ borderLeft: "2px solid #14B8A6", paddingLeft: 10 }}>
          <p style={{
            fontSize: 11, color: "var(--text-muted)", lineHeight: 1.65, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {profile.bio ?? "Web3 builder on Crewboard"}
          </p>
        </div>

        {/* Skills */}
        {Array.isArray(profile.skills) && profile.skills.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {profile.skills.slice(0, 4).map((s, i) => (
              <span key={i} style={{
                background: "var(--bg-secondary)", border: "0.5px solid var(--border)",
                borderRadius: 99, padding: "2px 8px", fontSize: 10, color: "var(--text-muted)",
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { val: String(profile.ordersCompleted), label: "Orders", teal: false },
            { val: `$${profile.totalEarned.toLocaleString()}`, label: "Earned", teal: true },
            { val: profile.avgRating ? profile.avgRating.toFixed(1) : "—", label: "Rating", teal: false },
          ].map((st, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: 7, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: st.teal ? "#14B8A6" : "var(--foreground)" }}>{st.val}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Wallet row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 10px", background: "var(--bg-secondary)", borderRadius: 8,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <span style={{ flex: 1, fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile.walletAddress
              ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}`
              : "No wallet connected"}
          </span>
          {profile.walletAddress && (
            <span style={{ background: "#dcfce7", color: "#166534", borderRadius: 99, padding: "2px 6px", fontSize: 9, whiteSpace: "nowrap" }}>
              Verified
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// ── Per-card component (owns drag state) ─────────────────────────────────────
function ProfileCard({
  profile,
  onExpand,
  onSave,
  onHire,
}: {
  profile: Profile;
  onExpand: () => void;
  onSave: () => void;
  onHire: () => void;
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [flyDir, setFlyDir] = useState<"left" | "right" | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const isDragging = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const doFly = (dir: "left" | "right") => {
    if (isFlying) return;
    setIsFlying(true);
    setFlyDir(dir);
    if (dir === "left") onSave();
    else onHire();
    setTimeout(() => {
      setFlyDir(null);
      setDragOffset(0);
      setIsFlying(false);
      const slide = wrapRef.current?.closest("[data-slide]") as HTMLElement | null;
      const next = slide?.nextElementSibling as HTMLElement | null;
      if (next) next.scrollIntoView({ behavior: "smooth" });
    }, 400);
  };

  const flyX = flyDir === "left" ? -2000 : flyDir === "right" ? 2000 : dragOffset;
  const flyR = flyX * 0.04;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFlying) return;
    isDragging.current = false;
    setDragStart(e.clientX);
    setDragStartY(e.clientY);
    // capture so drag stays tracked even if pointer leaves element
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart === null || isFlying) return;
    const dx = e.clientX - dragStart;
    if (Math.abs(dx) > 8) isDragging.current = true;
    setDragOffset(dx);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isFlying) return;
    const dx = dragOffset;
    const dy = dragStartY !== null ? e.clientY - dragStartY : 0;

    if (!isDragging.current) {
      // tap → expand
      onExpand();
    } else if (Math.abs(dy) > 50 && Math.abs(dx) < 25) {
      // vertical swipe → scroll container
      const slide = wrapRef.current?.closest("[data-slide]") as HTMLElement | null;
      if (dy < 0) {
        (slide?.nextElementSibling as HTMLElement | null)?.scrollIntoView({ behavior: "smooth" });
      } else {
        (slide?.previousElementSibling as HTMLElement | null)?.scrollIntoView({ behavior: "smooth" });
      }
      setDragOffset(0);
    } else if (dx > 100) {
      doFly("right");
    } else if (dx < -100) {
      doFly("left");
    } else {
      setDragOffset(0);
    }
    setDragStart(null);
    setDragStartY(null);
    isDragging.current = false;
  };

  const onPointerCancel = () => {
    // reset without triggering expand or fly
    setDragStart(null);
    setDragStartY(null);
    setDragOffset(0);
    isDragging.current = false;
  };

  return (
    <div
      ref={wrapRef}
      style={{
        width: "min(calc(100vw - 32px), 380px)",
        height: "clamp(500px, calc(100vh - 130px), 720px)",
        minHeight: 480,
        borderRadius: 20,
        overflow: "hidden",
        background: "var(--background)",
        border: "0.5px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        transform: `translateX(${flyX}px) rotate(${flyR}deg)`,
        transition: flyDir
          ? "transform 0.4s ease"
          : dragStart
          ? "none"
          : "transform 0.3s ease",
        cursor: dragStart ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        position: "relative",
        flexShrink: 0,
        animation: "cardIn 0.22s ease",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* SAVE stamp */}
      {dragOffset < -30 && (
        <div style={{
          position: "absolute", top: 24, left: 24,
          background: "#8b5cf6", color: "white", borderRadius: 8,
          padding: "6px 14px", fontSize: 18, fontWeight: 700,
          border: "3px solid white", zIndex: 10,
          transform: "rotate(-15deg)", pointerEvents: "none",
        }}>SAVE</div>
      )}
      {/* HIRE stamp */}
      {dragOffset > 30 && (
        <div style={{
          position: "absolute", top: 24, right: 24,
          background: "#14B8A6", color: "white", borderRadius: 8,
          padding: "6px 14px", fontSize: 18, fontWeight: 700,
          border: "3px solid white", zIndex: 10,
          transform: "rotate(15deg)", pointerEvents: "none",
        }}>HIRE</div>
      )}

      <CardInner profile={profile} />
    </div>
  );
}

// ── Expanded overlay content ──────────────────────────────────────────────────
function CardContent({ profile }: { profile: Profile }) {
  return (
    <>
      <CardInner profile={profile} />
      <div style={{ padding: "8px 18px 14px", background: "var(--background)", borderTop: "0.5px solid var(--border)" }}>
        <button
          onClick={() => window.open(`/u/${profile.twitterHandle}`, "_blank")}
          style={{ fontSize: 12, color: "#14B8A6", background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "center" }}
        >
          View full profile →
        </button>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfileSwipe({ profiles }: { profiles: Profile[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "save" | "hire" } | null>(null);

  const showToast = (msg: string, type: "save" | "hire") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const expandedProfile = expandedId ? profiles.find((p) => p.id === expandedId) ?? null : null;
  const isOpen = !!expandedId;

  return (
    <div style={{ position: "relative", paddingTop: 56 }}>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "hire" ? "#14B8A6" : "#8b5cf6",
          color: "white", borderRadius: 99, padding: "10px 24px",
          fontSize: 14, fontWeight: 500, zIndex: 100, whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Blur overlay — tap to close */}
      <div
        style={{
          position: "fixed", inset: 0, top: 56,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          zIndex: 20,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
        onClick={() => setExpandedId(null)}
      />

      {/* Save button — slides in from left */}
      <button
        onClick={() => {
          if (!expandedId) return;
          saveProfileAction(expandedId).catch(console.error);
          showToast("Saved! 🔖", "save");
          setExpandedId(null);
        }}
        style={{
          position: "fixed",
          left: "max(12px, calc(50% - 260px))",
          top: "50vh",
          transform: `translateY(-50%) translateX(${isOpen ? "0px" : "-80px"})`,
          opacity: isOpen ? 1 : 0,
          transition: "all 0.3s ease 0.08s",
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 35,
          width: 56, height: 56, borderRadius: "50%",
          background: "white", border: "2px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        }}
      >
        <Bookmark size={22} color="#6b7280" />
      </button>

      {/* Hire button — slides in from right */}
      <button
        onClick={() => {
          if (!expandedId) return;
          sendHireMessage(expandedId).catch(console.error);
          showToast("Message sent! 💬", "hire");
          setExpandedId(null);
        }}
        style={{
          position: "fixed",
          right: "max(12px, calc(50% - 260px))",
          top: "50vh",
          transform: `translateY(-50%) translateX(${isOpen ? "0px" : "80px"})`,
          opacity: isOpen ? 1 : 0,
          transition: "all 0.3s ease 0.08s",
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 35,
          width: 56, height: 56, borderRadius: "50%",
          background: "#14B8A6", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 12px rgba(20,184,166,0.4)",
        }}
      >
        <MessageCircle size={22} color="white" />
      </button>

      {/* Expanded card overlay (fixed, full height below navbar) */}
      {expandedProfile && (
        <div
          style={{
            position: "fixed",
            top: 56, left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100vw - 24px)", maxWidth: 440,
            height: "calc(100vh - 76px)",
            borderRadius: 20, overflow: "hidden",
            background: "white",
            boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            zIndex: 30,
            display: "flex", flexDirection: "column",
            animation: "cardIn 0.22s ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent profile={expandedProfile} />
        </div>
      )}

      {/* Scroll-snap container */}
      <div
        className="talent-scroll-container"
        style={{
          height: "calc(100vh - 56px)",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {profiles.map((profile) => (
          <div
            key={profile.id}
            data-slide="true"
            className="talent-scroll-slide"
            style={{
              height: "calc(100vh - 56px)",
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              flexShrink: 0,
              background: "var(--bg-secondary)",
            }}
          >
            {/* Left hint */}
            <div style={{
              position: "absolute", left: 14, top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11, color: "rgba(128,128,128,0.35)",
              writingMode: "vertical-rl", letterSpacing: "0.1em",
              userSelect: "none", pointerEvents: "none",
            }}>
              ← SAVE
            </div>
            {/* Right hint */}
            <div style={{
              position: "absolute", right: 14, top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11, color: "rgba(128,128,128,0.35)",
              writingMode: "vertical-rl", letterSpacing: "0.1em",
              userSelect: "none", pointerEvents: "none",
            }}>
              HIRE →
            </div>

            <ProfileCard
              profile={profile}
              onExpand={() => setExpandedId(profile.id)}
              onSave={() => {
                saveProfileAction(profile.id).catch(console.error);
                showToast("Saved! 🔖", "save");
              }}
              onHire={() => {
                sendHireMessage(profile.id).catch(console.error);
                showToast("Message sent! 💬", "hire");
              }}
            />
          </div>
        ))}

        {/* End-of-list slide */}
        <div
          data-slide="true"
          className="talent-scroll-slide"
          style={{
            height: "calc(100vh - 56px)",
            scrollSnapAlign: "start",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "var(--bg-secondary)",
            gap: 12, padding: 32, textAlign: "center",
          }}
        >
          <div style={{ fontSize: 52 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
            You&apos;ve seen everyone!
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
            Check back for new Web3 builders joining Crewboard.
          </p>
        </div>
      </div>
    </div>
  );
}
