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
        padding: "44px 52px 0",
        overflow: "hidden",
        position: "relative",
        background: [
          "radial-gradient(ellipse 90% 58% at 30% 95%, rgba(20,184,166,0.22) 0%, rgba(134,239,172,0.13) 44%, transparent 70%)",
          "#ffffff",
        ].join(", "),
      }}>

        {/* ── Logo ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 34, flexShrink: 0,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" style={{ width: 36, height: 36 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 400 }}>crew</span>board
            </div>
            <div style={{ fontSize: 7, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 3 }}>
              Web3 Talent Marketplace
            </div>
          </div>
        </div>

        {/* ── Badge ── */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999, width: "fit-content",
          background: "rgba(20,184,166,0.08)", border: "1.5px solid rgba(20,184,166,0.22)",
          color: "#0d9488", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", marginBottom: 18, flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: "#14B8A6" }}>✦</span>
          The future of work is onchain
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          margin: "0 0 13px", flexShrink: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: "2.05rem", fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.05em", lineHeight: 1.08, maxWidth: 380,
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
          margin: "0 0 32px", flexShrink: 0,
          fontSize: 13.5, color: "#64748b", lineHeight: 1.68,
          maxWidth: 305, fontWeight: 400,
        }}>
          Hire top talent or find meaningful work with secure payments,
          verified profiles, and a trusted community.
        </p>

        {/* ── Features ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, flexShrink: 0 }}>
          {FEATURES.map(({ Icon, bg, color, title, sub }) => (
            <div key={title} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: bg, color,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.4 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Spacer — gradient shows through here ── */}
        <div style={{ flex: 1 }} />

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "18px 0 28px", fontSize: 11.5, color: "#94a3b8",
          flexShrink: 0,
        }}>
          © 2026 Crewboard
          <span style={{ color: "#cbd5e1", fontSize: 13 }}>•</span>
          <svg width="14" height="10" viewBox="0 0 397 312" fill="none" style={{ opacity: 0.55 }}>
            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5C.7 77.6-2.2 70.6 1.9 66.5L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#94a3b8"/>
          </svg>
          Built on Solana
        </div>

      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div style={{
        width: "47%", maxWidth: 560, flexShrink: 0,
        position: "relative",
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
