import React from "react";

export default function AuthLayout({
  children,
  step = 1,
}: {
  children: React.ReactNode;
  step?: 1 | 2 | 3;
}) {
  const STEPS = [
    { n: "1", label: "Sign up your\naccount" },
    { n: "2", label: "Set up your\nworkspace" },
    { n: "3", label: "Set up your\nprofile" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", fontFamily: "'Inter', sans-serif",
      background: "#ffffff", overflow: "hidden",
    }}>

      {/* ═══════════════ LEFT PANEL ═══════════════ */}
      <div
        className="auth-left"
        style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          position: "relative",
          background: "#0a1210",
          overflow: "hidden",
        }}
      >
        {/* ── Orb glow ── */}
        <div style={{
          position: "absolute",
          top: "8%", left: "50%",
          transform: "translateX(-50%)",
          width: "110%", paddingBottom: "110%",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.92) 0%, rgba(160,240,200,0.55) 22%, rgba(20,184,166,0.22) 48%, rgba(20,100,80,0.06) 68%, transparent 78%)",
          pointerEvents: "none",
        }} />

        {/* ── Logo ── */}
        <div style={{ padding: "32px 36px 0", position: "relative", zIndex: 1, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-animated.svg" alt="Crewboard" style={{ width: 30, height: 30 }} />
            <span style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.4px", lineHeight: 1 }}>
              <span style={{ fontWeight: 400 }}>crew</span>board
            </span>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Bottom content ── */}
        <div style={{ padding: "0 36px 36px", position: "relative", zIndex: 1, flexShrink: 0 }}>

          {/* Headline + sub */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
            <h2 style={{
              fontSize: "clamp(28px, 3.2vw, 40px)", fontWeight: 800,
              color: "#ffffff", letterSpacing: "-0.04em", lineHeight: 1.08,
              margin: 0, flexShrink: 0,
            }}>
              Get Started<br />with Us
            </h2>
            <p style={{
              fontSize: 13, color: "#8a9fa0", maxWidth: 180,
              lineHeight: 1.6, margin: 0, paddingBottom: 2, textAlign: "right",
            }}>
              Complete these easy steps to register your account.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {STEPS.map((s, i) => {
              const active = i + 1 === step;
              return (
                <div key={s.n} style={{
                  background: active ? "#ffffff" : "rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "14px 14px 16px",
                  border: active ? "none" : "1px solid rgba(255,255,255,0.09)",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: active ? "#111111" : "rgba(255,255,255,0.18)",
                    color: "#ffffff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, marginBottom: 18,
                  }}>
                    {s.n}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? "#0f172a" : "rgba(255,255,255,0.6)",
                    lineHeight: 1.45, whiteSpace: "pre-line",
                  }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 26, fontSize: 11.5, color: "rgba(255,255,255,0.28)",
          }}>
            <span>2026 Crewboard</span>
            <span>Build on Solana</span>
          </div>
        </div>
      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div
        className="auth-right"
        style={{
          width: "48%", maxWidth: 580, flexShrink: 0,
          background: "#ffffff",
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left  { display: none !important; }
          .auth-right { width: 100% !important; max-width: 100% !important; }
        }
        * { box-sizing: border-box; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #f4f4f5 inset !important;
          -webkit-text-fill-color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
