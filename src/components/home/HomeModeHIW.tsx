"use client";
import Link from "next/link";
import { useMode } from "@/components/ModeProvider";

const CLIENT_STEPS = [
  {
    step: "1",
    title: "Post your job & set budget",
    desc: "Create your project and lock funds in escrow so talent knows the budget is real.",
    bg: "#d1fae5",
    numBg: "#10b981",
    numColor: "#fff",
  },
  {
    step: "2",
    title: "Find & hire talent",
    desc: "Browse verified freelancers or crews and choose the right fit for your project.",
    bg: "#ffe4cc",
    numBg: "#f97316",
    numColor: "#fff",
  },
  {
    step: "3",
    title: "Collaborate & track progress",
    desc: "Work together inside the platform. Chat, share files, and manage milestones easily.",
    bg: "#fef9c3",
    numBg: "#eab308",
    numColor: "#fff",
  },
  {
    step: "4",
    title: "Approve & release payment",
    desc: "Review the work and release funds instantly when everything is completed.",
    bg: "#ede9fe",
    numBg: "#8b5cf6",
    numColor: "#fff",
  },
];

const FREELANCER_STEPS = [
  {
    step: "1",
    title: "Create your profile & list services",
    desc: "Set up your profile, add your skills, and list what you offer. Free to join.",
    bg: "#d1fae5",
    numBg: "#10b981",
    numColor: "#fff",
  },
  {
    step: "2",
    title: "Get discovered & hired",
    desc: "Clients find you through the talent directory or job board. Chat and agree on scope.",
    bg: "#ffe4cc",
    numBg: "#f97316",
    numColor: "#fff",
  },
  {
    step: "3",
    title: "Do the work",
    desc: "Complete the project on time. Communicate with your client through built-in DMs.",
    bg: "#fef9c3",
    numBg: "#eab308",
    numColor: "#fff",
  },
  {
    step: "4",
    title: "Deliver & get paid instantly",
    desc: "Submit your work. Once the client approves, payment is released directly to your wallet.",
    bg: "#ede9fe",
    numBg: "#8b5cf6",
    numColor: "#fff",
  },
];

const TRUST_ITEMS = [
  { label: "Verified professionals" },
  { label: "Secure escrow payments" },
  { label: "Direct communication" },
];

export default function HomeModeHIW({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { mode } = useMode();
  const steps = mode === "hiring" ? CLIENT_STEPS : FREELANCER_STEPS;

  return (
    <>
      {/* 2×2 colorful grid — mirrors the iOS app exactly */}
      <div style={{ display: "grid", gap: "clamp(0.75rem,1.5vw,1rem)" }} className="hiw-grid">
        {steps.map((item) => (
          <div
            key={item.step}
            className="hiw-card"
            style={{
              position: "relative",
              padding: "clamp(1.25rem,2.5vw,1.75rem)",
              borderRadius: 20,
              background: item.bg,
              border: "none",
              minHeight: 190,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            {/* Step number — top right, colored circle */}
            <div style={{
              position: "absolute",
              top: "clamp(14px,2vw,20px)",
              right: "clamp(14px,2vw,20px)",
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: item.numBg,
              color: item.numColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.95rem",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${item.numBg}55`,
            }}>
              {item.step}
            </div>

            {/* Title — big, bold, bottom-aligned */}
            <h3 style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.1rem,2vw,1.3rem)",
              color: "#0a0a0a",
              margin: "0 0 0.5rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              maxWidth: "85%",
            }}>
              {item.title}
            </h3>

            {/* Description */}
            <p style={{
              color: "rgba(0,0,0,0.55)",
              fontSize: "0.83rem",
              lineHeight: 1.6,
              margin: 0,
            }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flexWrap: "wrap", gap: "1rem 2.5rem",
        marginTop: "1.75rem",
        padding: "1rem 1.5rem",
        borderRadius: 14,
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}>
        {TRUST_ITEMS.map((t) => (
          <div key={t.label} style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: "0.82rem", fontWeight: 500, color: "var(--text-muted)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--brand)", flexShrink: 0, display: "inline-block",
            }} />
            {t.label}
          </div>
        ))}
        {!isLoggedIn && (
          <Link href="/register" style={{
            display: "inline-flex", alignItems: "center",
            padding: "7px 18px", borderRadius: 999,
            background: "#0a0a0a", color: "#fff",
            fontSize: "0.82rem", fontWeight: 600,
            textDecoration: "none", letterSpacing: "-0.01em",
            transition: "opacity 0.15s",
          }}>
            Get started free →
          </Link>
        )}
      </div>

      <style>{`
        .hiw-grid { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 600px) { .hiw-grid { grid-template-columns: 1fr; } }
        .hiw-card { transition: transform 0.18s, box-shadow 0.18s; cursor: default; }
        .hiw-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
      `}</style>
    </>
  );
}
