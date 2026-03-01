import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <main className="page">
      <div
        style={{
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.35em",
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            marginBottom: "1.8rem",
            opacity: 0,
            animation: "fadeUp 0.8s 0.2s forwards",
          }}
        >
          Platform · 2026
        </div>

        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 9vw, 6.5rem)",
            letterSpacing: "0.08em",
            lineHeight: 1,
            marginBottom: "1.2rem",
            textAlign: "center",
            opacity: 0,
            animation: "fadeUp 0.8s 0.4s forwards",
          }}
        >
          CREWBOARD
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "3rem", opacity: 0, animation: "fadeUp 0.8s 0.6s forwards" }}>
          Connecting talents. Building crews. The future of collaboration is here.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", opacity: 0, animation: "fadeUp 0.8s 0.8s forwards" }}>
          <Link className="btn-primary" href="/whitepaper">Read Whitepaper</Link>
          {isLoggedIn ? (
            <Link className="btn-outline" href="/dashboard">Dashboard</Link>
          ) : (
            <Link className="btn-outline" href="/login">Login</Link>
          )}
        </div>

        {/* ✅ Scroll animation */}
        <div className="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </div>
    </main>
  );
}