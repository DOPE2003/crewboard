export const metadata = { title: "Projects — Crewboard" };

export default function ProjectsPage() {
  return (
    <main className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 1.5rem 6rem", textAlign: "center" }}>

        {/* Coming Soon Banner */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "rgba(45,212,191,0.08)",
          border: "1px solid rgba(45,212,191,0.25)",
          borderRadius: 999,
          padding: "0.35rem 1rem",
          marginBottom: "2rem",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#2DD4BF", flexShrink: 0,
            animation: "pulse 2s infinite",
          }} />
          <span style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#2DD4BF",
            fontWeight: 600,
          }}>
            Coming Soon
          </span>
        </div>

        <h1 style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          color: "#0f172a",
          lineHeight: 1,
          marginBottom: "1rem",
        }}>
          Projects
        </h1>

        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "1rem",
          color: "rgba(0,0,0,0.45)",
          lineHeight: 1.65,
          maxWidth: 480,
          margin: "0 auto 2.5rem",
        }}>
          Post open Web3 projects and find the right crew to build with. Launching soon.
        </p>

        <a
          href="mailto:info@crewboard.fun"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "0.875rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.75rem 1.75rem",
            borderRadius: 8,
            background: "#0f172a",
            color: "#fff",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
        >
          Get Early Access
        </a>

      </div>
    </main>
  );
}
