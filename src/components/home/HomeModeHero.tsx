"use client";
import { useMode } from "@/components/ModeProvider";
import HeroSearch from "@/components/home/HeroSearch";

export default function HomeModeHero() {
  const { mode } = useMode();
  const isClient = mode === "hiring";

  return (
    <>
      <h1
        className="hero-h1"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.0,
          marginBottom: "1.25rem",
          color: "var(--foreground)",
          opacity: 0,
          animation: "fadeUp 0.6s 0.25s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient ? (
          <>Hire the crew<br />behind the <span style={{ color: "#14B8A6" }}>work.</span></>
        ) : (
          <>Find work that<br /><span style={{ color: "#14B8A6" }}>actually ships.</span></>
        )}
      </h1>

      <p
        className="hero-subtitle"
        style={{
          color: "var(--text-muted)",
          fontSize: "1.05rem",
          lineHeight: 1.6,
          maxWidth: "30rem",
          letterSpacing: "-0.01em",
          marginBottom: "1.5rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.58s forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        {isClient
          ? "A curated marketplace for production teams. Browse verified talent, lock a budget, and pay securely when the work is delivered."
          : "Browse real jobs from real productions. Get matched, get paid — secured by escrow so you never chase an invoice."}
      </p>

      <div className="flex md:hidden" style={{
        opacity: 0, animation: "fadeUp 0.6s 0.65s forwards",
        position: "relative", zIndex: 1, width: "100%",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <HeroSearch />
      </div>

    </>
  );
}
