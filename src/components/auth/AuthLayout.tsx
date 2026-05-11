import React from "react";

/* ─── Icons ─────────────────────────────────────────────────── */
const ShieldCheckIcon = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const LockIcon = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ChatIcon = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FEATURES = [
  { Icon: ShieldCheckIcon, bg: "#dcfce7", color: "#16a34a", title: "Verified professionals", sub: "Quality you can trust" },
  { Icon: LockIcon,        bg: "#ffedd5", color: "#ea580c", title: "Secure payments",        sub: "Escrow protection on every job" },
  { Icon: ChatIcon,        bg: "#ede9fe", color: "#7c3aed", title: "Direct communication",   sub: "Connect and collaborate easily" },
];

/* ─── Tiny profile card ──────────────────────────────────────── */
function MiniCard({ bg, initials, name, role, rate }: { bg: string; initials: string; name: string; role: string; rate: string }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: "10px 11px",
      border: "1px solid #f0f4f8",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: bg, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 10.5, fontWeight: 800,
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>{role}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{rate}</div>
    </div>
  );
}

/* ─── App Mockup ─────────────────────────────────────────────── */
function AppMockup() {
  return (
    <div style={{
      width: 410,
      borderRadius: 20,
      background: "#ffffff",
      boxShadow: "0 24px 64px rgba(0,0,0,0.14), 0 6px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "13px 16px 12px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fff",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #14B8A6 0%, #0d9488 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px", lineHeight: 1 }}>crewboard</div>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
            Web3 Talent Marketplace
          </div>
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, padding: "11px 13px 14px" }}>

        {/* Left: main feature card */}
        <div style={{
          background: "#f8fafc", borderRadius: 15, padding: "13px 13px",
          border: "1px solid #eef2f7",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #14B8A6, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 800,
            }}>AE</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>AI Expert</div>
              <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>@0.x · @talentdropher</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 9 }}>Smart Contract Developer</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>$80 / hr</div>
              <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>500+ jobs completed</div>
            </div>
            <button style={{
              padding: "5px 13px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: "#14B8A6", color: "#fff", border: "none", cursor: "default",
            }}>Save</button>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {[
              { bg: "linear-gradient(135deg,#14B8A6,#0d9488)", l: "A" },
              { bg: "linear-gradient(135deg,#f97316,#ea580c)", l: "B" },
              { bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)", l: "C" },
              { bg: "linear-gradient(135deg,#ec4899,#db2777)", l: "D" },
            ].map((a, i) => (
              <div key={i} style={{
                width: 21, height: 21, borderRadius: "50%",
                background: a.bg, border: "2.5px solid #f8fafc",
                marginLeft: i === 0 ? 0 : -6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 7.5, fontWeight: 700, color: "#fff",
              }}>{a.l}</div>
            ))}
            <span style={{ fontSize: 9.5, color: "#94a3b8", marginLeft: 5 }}>+124 more</span>
          </div>
        </div>

        {/* Right: 3 mini cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <MiniCard
            bg="linear-gradient(135deg,#14B8A6,#0d9488)"
            initials="AE"
            name="AI Expert"
            role="Blockchain Dev"
            rate="$80 / hr"
          />
          <MiniCard
            bg="linear-gradient(135deg,#8b5cf6,#7c3aed)"
            initials="SP"
            name="Sol Pro"
            role="Rust Engineer"
            rate="$95 / hr"
          />
          <div style={{ opacity: 0.55 }}>
            <MiniCard
              bg="linear-gradient(135deg,#f97316,#ea580c)"
              initials="WD"
              name="Web3 Dev"
              role="Full Stack"
              rate="$70 / hr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Layout ────────────────────────────────────────────── */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", fontFamily: "'Inter', sans-serif",
      background: "#ffffff", overflow: "hidden",
    }}>

      {/* ═══════════════ LEFT PANEL ═══════════════ */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        padding: "40px 48px 0",
        overflow: "visible",
        position: "relative",
        zIndex: 2,
        background: [
          "radial-gradient(ellipse 90% 62% at 38% 82%, rgba(20,184,166,0.28) 0%, rgba(134,239,172,0.17) 42%, transparent 70%)",
          "#ffffff",
        ].join(", "),
      }}>

        {/* ── Logo ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 30, flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" style={{ width: 38, height: 38 }} />
          <div>
            <div style={{ fontSize: 17.5, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 400 }}>crew</span>board
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 3 }}>
              Web3 Talent Marketplace
            </div>
          </div>
        </div>

        {/* ── Badge ── */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999, width: "fit-content",
          background: "rgba(20,184,166,0.08)", border: "1.5px solid rgba(20,184,166,0.22)",
          color: "#0d9488", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 16,
          flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          <span style={{ fontSize: 10, color: "#14B8A6" }}>✦</span>
          The future of work is onchain
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          margin: "0 0 11px", flexShrink: 0, position: "relative", zIndex: 1,
          fontFamily: "'Inter', sans-serif",
          fontSize: "2.1rem", fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.05em", lineHeight: 1.08, maxWidth: 390,
        }}>
          The professional<br />
          network{" "}<span style={{
            background: "linear-gradient(135deg, #14B8A6 0%, #0d9488 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Web3</span><br />
          deserves.
        </h1>

        {/* ── Subtext ── */}
        <p style={{
          margin: "0 0 26px", flexShrink: 0, position: "relative", zIndex: 1,
          fontSize: 14, color: "#64748b", lineHeight: 1.65,
          maxWidth: 310, fontWeight: 400,
        }}>
          Hire top talent or find meaningful work with secure payments,
          verified profiles, and a trusted community.
        </p>

        {/* ── Features ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flexShrink: 0, position: "relative", zIndex: 1 }}>
          {FEATURES.map(({ Icon, bg, color, title, sub }) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: bg, color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 1 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.4 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "16px 0 26px", fontSize: 11.5, color: "#94a3b8",
          flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          © 2026 Crewboard
          <span style={{ color: "#cbd5e1", fontSize: 13 }}>•</span>
          <svg width="14" height="10" viewBox="0 0 397 312" fill="none" style={{ opacity: 0.6 }}>
            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5C.7 77.6-2.2 70.6 1.9 66.5L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#94a3b8"/>
          </svg>
          Built on Solana
        </div>

        {/* ── 3D Mockup — absolute, bleeds past panel right edge ── */}
        <div style={{
          position: "absolute",
          bottom: 56,
          left: 36,
          zIndex: 4,
          pointerEvents: "none",
          transform: "perspective(900px) rotateY(-9deg) rotateX(5deg)",
          transformOrigin: "left center",
        }}>
          <AppMockup />
        </div>

      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div style={{
        width: "47%", maxWidth: 560, flexShrink: 0,
        position: "relative", zIndex: 1,
        background: "#ffffff",
        borderLeft: "1px solid #f1f5f9",
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.04)",
      }}>
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-right { width: 100% !important; max-width: 100% !important; border-left: none !important; box-shadow: none !important; }
        }
        * { box-sizing: border-box; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #f8fafc inset !important;
          -webkit-text-fill-color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
