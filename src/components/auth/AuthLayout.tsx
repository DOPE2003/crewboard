import React from "react";

/* ─── Icons ─────────────────────────────────────────────────── */
const ShieldCheckIcon = ({ size = 19, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const LockIcon = ({ size = 19, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ChatIcon = ({ size = 19, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

/* ─── Data ───────────────────────────────────────────────────── */
const FEATURES = [
  { Icon: ShieldCheckIcon, bg: "#dcfce7", color: "#16a34a", title: "Verified professionals", sub: "Quality you can trust" },
  { Icon: LockIcon,        bg: "#ffedd5", color: "#ea580c", title: "Secure payments",        sub: "Escrow protection on every job" },
  { Icon: ChatIcon,        bg: "#ede9fe", color: "#7c3aed", title: "Direct communication",   sub: "Connect and collaborate easily" },
];

/* ─── App Mockup ─────────────────────────────────────────────── */
function AppMockup() {
  return (
    <div style={{
      position: "absolute", bottom: 0, right: -104,
      width: 274, zIndex: 5,
      borderRadius: "18px 18px 0 0",
      background: "#ffffff",
      boxShadow: "0 -8px 48px rgba(0,0,0,0.10), 0 -2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)",
      overflow: "hidden",
    }}>
      {/* App header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "13px 15px 11px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fff",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #14B8A6 0%, #0d9488 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px", lineHeight: 1 }}>
            crewboard
          </div>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
            Web3 Talent Marketplace
          </div>
        </div>
      </div>

      {/* Card 1 */}
      <div style={{ padding: "10px 12px 4px" }}>
        <div style={{
          background: "#f8fafc", borderRadius: 12, padding: "11px 12px",
          border: "1px solid #f1f5f9",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #14B8A6, #0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 800,
            }}>
              AE
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.2px" }}>AI Expert</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>@0.x · @talentdropher</div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: "#64748b", marginBottom: 7 }}>Smart Contract Developer</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>$80 / hr</div>
              <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>500+ jobs completed</div>
            </div>
            <button style={{
              padding: "5px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: "#14B8A6", color: "#fff", border: "none", cursor: "default",
              letterSpacing: "-0.1px",
            }}>
              Save
            </button>
          </div>
          {/* Stacked avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {[
              { bg: "linear-gradient(135deg, #14B8A6, #0d9488)", label: "A" },
              { bg: "linear-gradient(135deg, #f97316, #ea580c)", label: "B" },
              { bg: "linear-gradient(135deg, #8b5cf6, #7c3aed)", label: "C" },
              { bg: "linear-gradient(135deg, #ec4899, #db2777)", label: "D" },
            ].map((a, i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: "50%",
                background: a.bg,
                border: "2.5px solid #f8fafc",
                marginLeft: i === 0 ? 0 : -7,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 700, color: "#fff",
              }}>
                {a.label}
              </div>
            ))}
            <span style={{ fontSize: 9.5, color: "#94a3b8", marginLeft: 6 }}>+124 more</span>
          </div>
        </div>
      </div>

      {/* Card 2 — partially visible */}
      <div style={{ padding: "6px 12px 0" }}>
        <div style={{
          background: "#f8fafc", borderRadius: 12, padding: "11px 12px",
          border: "1px solid #f1f5f9",
          opacity: 0.85,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 12, fontWeight: 800,
            }}>
              SP
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>Sol Pro</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>@solpro · Rust Dev</div>
            </div>
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
        flex: 1, position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column",
        padding: "48px 56px 0",
        overflow: "visible",
        /* Layered gradients for mint/teal depth */
        background: [
          "radial-gradient(ellipse 100% 58% at 25% 85%, rgba(20,184,166,0.21) 0%, rgba(167,243,208,0.13) 40%, transparent 66%)",
          "radial-gradient(ellipse 55% 40% at 82% 92%, rgba(52,211,153,0.10) 0%, transparent 58%)",
          "radial-gradient(ellipse 70% 30% at 50% 100%, rgba(20,184,166,0.09) 0%, transparent 70%)",
          "#ffffff",
        ].join(", "),
      }}>

        {/* ── Logo ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 11,
          marginBottom: 44, position: "relative", zIndex: 1, flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" style={{ width: 42, height: 42 }} />
          <div>
            <div style={{
              fontSize: 19, fontWeight: 800, color: "#0f172a",
              letterSpacing: "-0.6px", lineHeight: 1.05,
            }}>
              <span style={{ fontWeight: 400 }}>crew</span>board
            </div>
            <div style={{
              fontSize: 8, fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 3,
            }}>
              Web3 Talent Marketplace
            </div>
          </div>
        </div>

        {/* ── Badge ── */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "6px 14px", borderRadius: 999, width: "fit-content",
          background: "rgba(20,184,166,0.08)", border: "1.5px solid rgba(20,184,166,0.24)",
          color: "#0d9488", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 22,
          position: "relative", zIndex: 1, flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: "#14B8A6" }}>✦</span>
          The future of work is onchain
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          margin: "0 0 14px", position: "relative", zIndex: 1, flexShrink: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: "clamp(2.35rem, 4vw, 3.1rem)",
          fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.05em", lineHeight: 1.06,
          maxWidth: 430,
        }}>
          The professional<br />
          network{" "}<span style={{
            color: "#14B8A6",
            background: "linear-gradient(135deg, #14B8A6 0%, #0d9488 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Web3</span><br />
          deserves.
        </h1>

        {/* ── Subtext ── */}
        <p style={{
          margin: "0 0 38px", position: "relative", zIndex: 1, flexShrink: 0,
          fontSize: 15, color: "#64748b", lineHeight: 1.7,
          maxWidth: 360, fontWeight: 400,
        }}>
          Hire top talent or find meaningful work with secure payments,
          verified profiles, and a trusted community.
        </p>

        {/* ── Features ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 1, flexShrink: 0 }}>
          {FEATURES.map(({ Icon, bg, color, title, sub }) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                background: bg, color,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 8px ${bg}`,
              }}>
                <Icon size={19} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 2 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "22px 0 30px", fontSize: 12, color: "#94a3b8",
          position: "relative", zIndex: 1, flexShrink: 0,
        }}>
          © 2026 Crewboard
          <span style={{ color: "#cbd5e1", fontSize: 14 }}>•</span>
          <svg width="15" height="11" viewBox="0 0 397 312" fill="none" style={{ opacity: 0.6 }}>
            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5C.7 77.6-2.2 70.6 1.9 66.5L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#94a3b8"/>
          </svg>
          Built on Solana
        </div>

        {/* ── Mockup ── */}
        <AppMockup />
      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div style={{
        width: "45%", maxWidth: 540, flexShrink: 0,
        position: "relative", zIndex: 1,
        background: "#ffffff",
        borderLeft: "1px solid #f1f5f9",
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 32px rgba(0,0,0,0.04)",
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
