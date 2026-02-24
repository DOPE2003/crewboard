import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      {/* nav spacing */}
      <div style={{ paddingTop: "90px" }} />

      <section
        style={{
          minHeight: "calc(100vh - 90px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
          position: "relative",
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
          }}
        >
          Platform · 2026
        </div>

        <h1
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(4rem, 10vw, 6.5rem)",
            letterSpacing: "0.08em",
            lineHeight: 1,
            marginBottom: "1.2rem",
          }}
        >
          CREWBOARD
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "3rem" }}>
          Connecting talents. Building crews. The future of collaboration is here.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link className="btn-primary" href="/whitepaper">Read Whitepaper</Link>
          <Link className="btn-outline" href="/login">Login</Link>
        </div>

        {/* ✅ Scroll animation */}
        <div className="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>
    </main>
  );
}