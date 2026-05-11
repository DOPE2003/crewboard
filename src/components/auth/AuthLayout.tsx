import React from "react";

/* Exact orb layers from Figma — stacked blurred circles */
const ORB_LAYERS = [
  { bg: "#052723", w: "126%", h: "121%", top: "-35%", blur: 50, shadow: "100px 100px 100px rgba(0,0,0,0.35)" },
  { bg: "#FEFEFE", w: "126%", h: "90%",  top: "27%",  blur: 50, shadow: "100px 100px 100px rgba(255,255,255,0.18)" },
  { bg: "#FEFEFE", w: "126%", h: "90%",  top: "27%",  blur: 50, backdrop: true },
  { bg: "#C9D1FA", w: "126%", h: "90%",  top: "35%",  blur: 40, shadow: "80px 80px 80px rgba(201,209,250,0.25)" },
  { bg: "#1B8A7D", w: "126%", h: "90%",  top: "46%",  blur: 50, shadow: "100px 100px 100px rgba(27,138,125,0.3)" },
  { bg: "#111111", w: "126%", h: "90%",  top: "57%",  blur: 50, shadow: "100px 100px 100px rgba(0,0,0,0.5)" },
];

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
      background: "#FEFEFE",
    }}>

      {/* ═══ LEFT — outer white gap + rounded black card ═══ */}
      <div
        className="auth-left"
        style={{
          flex: "0 0 48%", maxWidth: 720,
          padding: "21px 0 21px 20px",
          boxSizing: "border-box",
        }}
      >
        {/* Black card */}
        <div style={{
          width: "100%", height: "100%",
          background: "#000000",
          borderRadius: 45,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>

          {/* ── Orb layers ── */}
          {ORB_LAYERS.map((l, i) => (
            <div key={i} style={{
              position: "absolute",
              left: "-13%",
              top: l.top,
              width: l.w,
              height: l.h,
              borderRadius: 9999,
              background: l.bg,
              filter: `blur(${l.blur}px)`,
              boxShadow: l.shadow,
              backdropFilter: l.backdrop ? `blur(${l.blur}px)` : undefined,
              pointerEvents: "none",
              zIndex: 0,
            }} />
          ))}

          {/* ── Logo ── */}
          <div style={{ padding: "40px 50px 0", position: "relative", zIndex: 1, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="30" height="30" viewBox="16 30 112 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="124,80 98,125 46,125 20,80 46,35 98,35"
                  fill="none" stroke="white" strokeWidth="5.5" strokeLinejoin="round"/>
                <line x1="72" y1="46" x2="46" y2="96" stroke="white" strokeWidth="4.4" strokeLinecap="round"/>
                <line x1="72" y1="46" x2="98" y2="96" stroke="white" strokeWidth="4.4" strokeLinecap="round"/>
                <line x1="46" y1="96" x2="98" y2="96" stroke="white" strokeWidth="4.4" strokeLinecap="round"/>
                <circle cx="72" cy="46" r="7" fill="white"/>
                <circle cx="46" cy="96" r="7" fill="white"/>
                <circle cx="98" cy="96" r="7" fill="white"/>
              </svg>
              <span style={{ fontSize: 18, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1 }}>
                <span style={{ fontWeight: 300 }}>crew</span>
                <span style={{ fontWeight: 700 }}>board</span>
              </span>
            </div>
          </div>

          {/* ── Spacer ── */}
          <div style={{ flex: 1 }} />

          {/* ── Bottom content ── */}
          <div style={{ padding: "0 50px 36px", position: "relative", zIndex: 1, flexShrink: 0 }}>

            {/* Headline + sub */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
              <h2 style={{
                fontSize: "clamp(32px, 3.5vw, 48px)", fontWeight: 600,
                color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1.08,
                margin: 0, flexShrink: 0,
              }}>
                Get Started<br />with Us
              </h2>
              <p style={{
                fontSize: 16, fontWeight: 400, color: "#ffffff",
                maxWidth: 200, lineHeight: 1.55, margin: 0,
                paddingBottom: 4, textAlign: "right", opacity: 0.85,
              }}>
                Complete these easy steps<br />to register your account.
              </p>
            </div>

            {/* Step cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
              {STEPS.map((s, i) => {
                const active = i + 1 === step;
                return (
                  <div key={s.n} style={{
                    background: active
                      ? "#FAFBFD"
                      : "linear-gradient(180deg, rgba(98,98,98,0.20) 0%, rgba(200,200,200,0.20) 100%)",
                    borderRadius: 16,
                    padding: "14px 14px 18px",
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 9999,
                      background: active ? "#000000" : "#636363",
                      color: "#ffffff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 400, marginBottom: 22, flexShrink: 0,
                    }}>
                      {s.n}
                    </div>
                    <div style={{
                      fontSize: 16, fontWeight: 400,
                      color: active ? "#000000" : "#ffffff",
                      lineHeight: 1.45, whiteSpace: "pre-line",
                    }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.55)" }}>
              <span>2026 Crewboard</span>
              <span>Build on Solana</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — form panel ═══ */}
      <div
        className="auth-right"
        style={{
          flex: 1,
          background: "#FEFEFE",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left  { display: none !important; }
          .auth-right { flex: 1 !important; }
        }
        * { box-sizing: border-box; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #F5F6FA inset !important;
          -webkit-text-fill-color: rgba(0,0,0,0.7) !important;
        }
      `}</style>
    </div>
  );
}
