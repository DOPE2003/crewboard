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

/* ─── Atmospheric illustration mockup ───────────────────────── */
function AppMockup() {
  return (
    <div style={{
      width: 390,
      borderRadius: 22,
      overflow: "hidden",
      background: "rgba(255,255,255,0.48)",
      boxShadow: [
        "0 2px 24px rgba(20,184,166,0.12)",
        "0 1px 8px rgba(0,0,0,0.04)",
        "inset 0 0 0 1px rgba(255,255,255,0.72)",
      ].join(", "),
    }}>

      {/* ── Header bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.55)",
        background: "rgba(255,255,255,0.38)",
      }}>
        {/* Logo icon blob */}
        <div style={{
          width: 27, height: 27, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(20,184,166,0.55) 0%, rgba(13,148,136,0.55) 100%)",
        }} />
        <div>
          {/* Wordmark blob */}
          <div style={{ height: 7, width: 76, borderRadius: 4, background: "rgba(15,23,42,0.2)", marginBottom: 5 }} />
          <div style={{ height: 4, width: 108, borderRadius: 3, background: "rgba(148,163,184,0.35)" }} />
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 12px 14px" }}>

        {/* Left: hero card */}
        <div style={{
          background: "rgba(255,255,255,0.52)",
          borderRadius: 16, padding: "13px 13px 11px",
          border: "1px solid rgba(255,255,255,0.65)",
        }}>
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, rgba(20,184,166,0.52), rgba(13,148,136,0.52))",
            }} />
            <div>
              <div style={{ height: 7, width: 54, borderRadius: 4, background: "rgba(15,23,42,0.22)", marginBottom: 5 }} />
              <div style={{ height: 4.5, width: 68, borderRadius: 3, background: "rgba(148,163,184,0.32)" }} />
            </div>
          </div>
          {/* Role line */}
          <div style={{ height: 5, width: "78%", borderRadius: 3, background: "rgba(100,116,139,0.2)", marginBottom: 10 }} />
          {/* Price + button row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ height: 10, width: 42, borderRadius: 4, background: "rgba(15,23,42,0.26)", marginBottom: 5 }} />
              <div style={{ height: 4.5, width: 60, borderRadius: 3, background: "rgba(148,163,184,0.28)" }} />
            </div>
            <div style={{
              height: 25, width: 50, borderRadius: 999,
              background: "rgba(20,184,166,0.45)",
            }} />
          </div>
          {/* Stacked avatar dots */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {[
              "rgba(20,184,166,0.45)",
              "rgba(249,115,22,0.42)",
              "rgba(139,92,246,0.42)",
              "rgba(236,72,153,0.42)",
            ].map((bg, i) => (
              <div key={i} style={{
                width: 19, height: 19, borderRadius: "50%",
                background: bg,
                border: "2px solid rgba(248,250,252,0.6)",
                marginLeft: i === 0 ? 0 : -6,
              }} />
            ))}
          </div>
        </div>

        {/* Right: 3 mini cards, fading */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { dot: "rgba(20,184,166,0.48)",  op: 1 },
            { dot: "rgba(139,92,246,0.45)",  op: 0.7 },
            { dot: "rgba(249,115,22,0.44)",  op: 0.4 },
          ].map((c, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.52)",
              borderRadius: 13, padding: "10px 11px",
              border: "1px solid rgba(255,255,255,0.65)",
              opacity: c.op,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                <div>
                  <div style={{ height: 6, width: 46, borderRadius: 3, background: "rgba(15,23,42,0.22)", marginBottom: 4 }} />
                  <div style={{ height: 4, width: 34, borderRadius: 3, background: "rgba(148,163,184,0.3)" }} />
                </div>
              </div>
              <div style={{ height: 8, width: 38, borderRadius: 4, background: "rgba(15,23,42,0.22)" }} />
            </div>
          ))}
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
        /* Soft mint atmosphere — large, centered low */
        background: [
          "radial-gradient(ellipse 92% 66% at 36% 84%, rgba(20,184,166,0.32) 0%, rgba(134,239,172,0.2) 40%, transparent 70%)",
          "#ffffff",
        ].join(", "),
      }}>

        {/* ── Logo ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 30, flexShrink: 0, position: "relative", zIndex: 1,
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
          padding: "5px 11px", borderRadius: 999, width: "fit-content",
          background: "rgba(20,184,166,0.08)", border: "1.5px solid rgba(20,184,166,0.22)",
          color: "#0d9488", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
          textTransform: "uppercase", marginBottom: 16,
          flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          <span style={{ fontSize: 9, color: "#14B8A6" }}>✦</span>
          The future of work is onchain
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          margin: "0 0 11px", flexShrink: 0, position: "relative", zIndex: 1,
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
          margin: "0 0 26px", flexShrink: 0, position: "relative", zIndex: 1,
          fontSize: 13.5, color: "#64748b", lineHeight: 1.65,
          maxWidth: 305, fontWeight: 400,
        }}>
          Hire top talent or find meaningful work with secure payments,
          verified profiles, and a trusted community.
        </p>

        {/* ── Features ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 15, flexShrink: 0, position: "relative", zIndex: 1 }}>
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
          <svg width="14" height="10" viewBox="0 0 397 312" fill="none" style={{ opacity: 0.55 }}>
            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zM64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5C.7 77.6-2.2 70.6 1.9 66.5L64.6 3.8zM333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#94a3b8"/>
          </svg>
          Built on Solana
        </div>

        {/* ── Illustration: angled, atmospheric, partially cropped ── */}
        <div style={{
          position: "absolute",
          /* sit in the lower portion, bleed right past the divider */
          bottom: 52,
          left: 22,
          zIndex: 3,
          pointerEvents: "none",
          /* soft atmospheric glow behind the card */
          filter: "drop-shadow(0 8px 32px rgba(20,184,166,0.22)) drop-shadow(0 2px 8px rgba(0,0,0,0.06))",
          /* perspective tilt — left side forward, right side recedes */
          transform: "perspective(1100px) rotateY(-11deg) rotateX(6deg)",
          transformOrigin: "38% 50%",
          opacity: 0.9,
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
