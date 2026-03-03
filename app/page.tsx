import Link from "next/link";
import { auth } from "@/auth";
import db from "@/lib/db";

const FEATURES = [
  {
    icon: "🔒",
    title: "Escrow Smart Contracts",
    desc: "Payments are held in automated smart contracts and released only on delivery. Zero counterparty risk.",
  },
  {
    icon: "⚡",
    title: "Instant Crypto Payouts",
    desc: "Get paid in ETH, USDC, or any token. No banks, no delays, no fees eating your earnings.",
  },
  {
    icon: "🏆",
    title: "On-Chain Reputation",
    desc: "Your track record lives on the blockchain — immutable, portable, and owned by you, not the platform.",
  },
  {
    icon: "🌐",
    title: "Multi-Chain Support",
    desc: "Deploy and collaborate across Ethereum, Polygon, Arbitrum, Solana. One profile, every chain.",
  },
  {
    icon: "🗳️",
    title: "DAO Governance",
    desc: "Token holders decide fees, features, and upgrades. The platform is built and owned by the community.",
  },
  {
    icon: "🎓",
    title: "Verified Credentials",
    desc: "NFT-based skill certificates verify your expertise on-chain. Prove what you know, not just what you claim.",
  },
];

export default async function HomePage() {
  const [session, counts] = await Promise.all([
    auth(),
    Promise.all([
      db.user.count({ where: { profileComplete: true } }),
      db.project.count(),
    ]).catch(() => [0, 0] as [number, number]),
  ]);
  const [builderCount, projectCount] = counts as [number, number];
  const isLoggedIn = !!session?.user;

  return (
    <main className="page">

      {/* ── HERO ── */}
      <div style={{
        minHeight: "calc(100vh - 90px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        position: "relative",
      }}>

        {/* Status chip */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontFamily: "Space Mono, monospace",
          fontSize: "0.58rem",
          letterSpacing: "0.28em",
          color: "rgba(0,0,0,0.45)",
          textTransform: "uppercase",
          marginBottom: "2.5rem",
          padding: "0.45rem 1rem",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: "999px",
          background: "rgba(0,0,0,0.04)",
          opacity: 0,
          animation: "fadeUp 0.6s 0.1s forwards",
        }}>
          CREWBOARD · PLATFORM
        </div>

        {/* Headline */}
        <h1 className="hero-h1" style={{
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 0.93,
          marginBottom: "2rem",
          color: "#000",
          opacity: 0,
          animation: "fadeUp 0.6s 0.25s forwards",
        }}>
          Where Web3 builders<br />
          find their <span style={{ color: "#2DD4BF" }}>crew.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          color: "rgba(0,0,0,0.55)",
          fontSize: "1rem",
          lineHeight: 1.85,
          maxWidth: "26rem",
          letterSpacing: "0.01em",
          marginBottom: "3rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.4s forwards",
        }}>
          Connect with builders. Ship real products.<br />
          The professional network Web3 deserves.
        </p>

        {/* CTAs */}
        <div style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          justifyContent: "center",
          opacity: 0,
          animation: "fadeUp 0.6s 0.55s forwards",
        }}>
          <Link className="btn-primary" href={isLoggedIn ? "/dashboard" : "/login"}>
            {isLoggedIn ? "Go to Dashboard" : "Join the Platform"}
          </Link>
          <Link className="btn-outline" href="/talent">
            Browse Talent →
          </Link>
        </div>

        {/* Scroll hint + divider + stats */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          marginTop: "4rem",
          opacity: 0,
          animation: "fadeUp 0.6s 0.7s forwards",
        }}>
          {/* Scroll label */}
          <span style={{
            fontFamily: "Space Mono, monospace",
            fontSize: "0.52rem",
            letterSpacing: "0.25em",
            color: "rgba(0,0,0,0.5)",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}>Scroll</span>

          {/* Animated scroll line */}
          <div className="scroll-line" style={{ marginBottom: "2rem" }} />

          {/* Stats row */}
          <div className="hero-stats-row" style={{
            display: "flex",
            gap: "4rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}>
            {([
              { value: builderCount.toString(), label: "Builders" },
              { value: projectCount.toString(), label: "Projects" },
              { value: "4", label: "Chains" },
            ] as const).map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                  color: "#000",
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                  marginBottom: "0.4rem",
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: "0.54rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(0,0,0,0.4)",
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding: "6rem 2rem", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <div className="section-label">Platform Features</div>
          <h2 style={{
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            color: "#000",
            marginBottom: "3.5rem",
            lineHeight: 1.15,
          }}>
            Built different.<br />
            <span style={{ color: "rgba(0,0,0,0.45)", fontWeight: 400 }}>
              Built for Web3.
            </span>
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                padding: "1.75rem",
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(0,0,0,0.02)",
                transition: "border-color 0.2s, background 0.2s",
              }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "1rem", lineHeight: 1 }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  letterSpacing: "0.02em",
                  color: "#000",
                  marginBottom: "0.5rem",
                }}>
                  {f.title}
                </h3>
                <p style={{ color: "rgba(0,0,0,0.55)", fontSize: "0.875rem", lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: "4rem 2rem 8rem", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>
          <div style={{
            borderRadius: 20,
            padding: "4rem 2.5rem",
            textAlign: "center",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(0,0,0,0.02)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* subtle teal glow */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "60%",
              height: "60%",
              background: "radial-gradient(ellipse, rgba(20,184,166,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div className="section-label" style={{ justifyContent: "center" }}>Join the Crew</div>
            <h2 style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#000",
              margin: "1rem 0",
            }}>
              Ready to build with the best?
            </h2>
            <p style={{
              color: "rgba(0,0,0,0.55)",
              fontSize: "1rem",
              lineHeight: 1.7,
              maxWidth: "32rem",
              margin: "0 auto 2.5rem",
            }}>
              Thousands of Web3 builders are already here. Find your next collaborator, or your next project.
            </p>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn-primary" href="/login">
                Join as Freelancer
              </Link>
              <Link className="btn-outline" href="/talent">
                Find Talent
              </Link>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
