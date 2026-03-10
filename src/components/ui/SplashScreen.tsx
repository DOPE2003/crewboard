"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Animation finishes at ~2s, then fade out
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    const hideTimer = setTimeout(() => setVisible(false), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.6s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* dot grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, #d4d4d4 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* top-right hex deco */}
      <svg
        style={{ position: "absolute", top: -100, right: -60, width: 460, height: 460, opacity: 0.06 }}
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon points="50,2 93,26 93,74 50,98 7,74 7,26" stroke="#111" strokeWidth="1.5" />
      </svg>

      {/* bottom-left hex deco */}
      <svg
        style={{ position: "absolute", bottom: -60, left: -40, width: 280, height: 280, opacity: 0.05 }}
        viewBox="0 0 100 100"
        fill="none"
      >
        <polygon points="50,2 93,26 93,74 50,98 7,74 7,26" stroke="#111" strokeWidth="1.5" />
      </svg>

      {/* animated logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 320 80"
        style={{ width: 360, height: 90, position: "relative", zIndex: 1 }}
      >
        <rect width="320" height="80" fill="transparent" />
        <defs>
          <style>{`
            .sp-hex  { fill:none; stroke:#111; stroke-width:2.2; stroke-linejoin:round;
                       stroke-dasharray:156; stroke-dashoffset:156;
                       animation:spDraw .75s cubic-bezier(.4,0,.2,1) .1s forwards; }
            .sp-ln   { fill:none; stroke:#111; stroke-width:1.8; stroke-linecap:round; }
            .sp-ln1  { stroke-dasharray:22; stroke-dashoffset:22; animation:spDraw .35s ease .85s forwards; }
            .sp-ln2  { stroke-dasharray:22; stroke-dashoffset:22; animation:spDraw .35s ease 1.0s forwards; }
            .sp-ln3  { stroke-dasharray:21; stroke-dashoffset:21; animation:spDraw .35s ease 1.15s forwards; }
            .sp-nd   { fill:#111; opacity:0; animation:spPop .28s cubic-bezier(.34,1.56,.64,1) forwards; }
            .sp-nd1  { animation-delay:1.18s; transform-origin:36px 27px; }
            .sp-nd2  { animation-delay:1.30s; transform-origin:26px 47px; }
            .sp-nd3  { animation-delay:1.42s; transform-origin:46px 47px; }
            .sp-wm   { fill:#111; opacity:0; animation:spSlide .5s cubic-bezier(.4,0,.2,1) 1.5s forwards;
                       font-family:Inter,'Helvetica Neue',Helvetica,Arial,sans-serif;
                       font-size:34px; letter-spacing:-1.2px; }
            @keyframes spDraw  { to { stroke-dashoffset:0; } }
            @keyframes spPop   { 0%{opacity:0;transform:scale(0)} 100%{opacity:1;transform:scale(1)} }
            @keyframes spSlide { 0%{opacity:0;transform:translateX(-8px)} 100%{opacity:1;transform:translateX(0)} }
          `}</style>
        </defs>
        <polygon className="sp-hex" points="62,40 49,62.5 23,62.5 10,40 23,17.5 49,17.5" />
        <line className="sp-ln sp-ln1" x1="36" y1="27" x2="26" y2="47" />
        <line className="sp-ln sp-ln2" x1="36" y1="27" x2="46" y2="47" />
        <line className="sp-ln sp-ln3" x1="26" y1="47" x2="46" y2="47" />
        <circle className="sp-nd sp-nd1" cx="36" cy="27" r="3.2" />
        <circle className="sp-nd sp-nd2" cx="26" cy="47" r="3.2" />
        <circle className="sp-nd sp-nd3" cx="46" cy="47" r="3.2" />
        <text className="sp-wm" x="80" y="51">
          <tspan fontWeight="300">crew</tspan>
          <tspan fontWeight="600">board</tspan>
        </text>
      </svg>

      <p
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 40,
          fontSize: 15,
          fontWeight: 300,
          color: "#aaa",
          letterSpacing: "0.04em",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Web3 Freelancer Marketplace
      </p>
    </div>
  );
}
