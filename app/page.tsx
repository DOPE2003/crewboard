import Link from "next/link";
import { auth } from "@/auth";

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
  const session = await auth();
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
        <div style={{
          fontFamily: "Space Mono, monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.35em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
          marginBottom: "1.8rem",
          opacity: 0,
          animation: "fadeUp 0.8s 0.2s forwards",
        }}>
          Platform · 2026
        </div>

        <h1 style={{
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 700,
          fontSize: "clamp(2rem, 6.5vw, 5rem)",
          letterSpacing: "0.03em",
          lineHeight: 1.15,
          marginBottom: "1.4rem",
          textAlign: "center",
          opacity: 0,
          animation: "fadeUp 0.8s 0.4s forwards",
        }}>
          The platform where{" "}
          <span style={{ display: "inline-block", position: "relative", padding: "0.05em 0.2em" }}>
            <span style={{
              position: "absolute", inset: 0,
              background: "rgba(20,184,166,0.15)",
              border: "1px solid rgba(20,184,166,0.3)",
              borderRadius: "6px",
            }} />
            <span style={{ position: "relative", color: "#5eead4" }}>Web3 talent</span>
          </span>
          {" "}meets{" "}
          <span style={{ display: "inline-block", position: "relative", padding: "0.05em 0.2em" }}>
            <span style={{
              position: "absolute", inset: 0,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "6px",
            }} />
            <span style={{ position: "relative", color: "#c4b5fd" }}>great work</span>
          </span>
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.5)",
          marginBottom: "3rem",
          maxWidth: "36rem",
          lineHeight: 1.7,
          opacity: 0,
          animation: "fadeUp 0.8s 0.6s forwards",
        }}>
          Connecting talents. Building crews. The future of Web3 collaboration is here.
        </p>

        <div style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justifyContent: "center",
          opacity: 0,
          animation: "fadeUp 0.8s 0.8s forwards",
        }}>
          <Link className="btn-primary" href="/whitepaper">Read Whitepaper</Link>
          {isLoggedIn ? (
            <Link className="btn-outline" href="/dashboard">Dashboard</Link>
          ) : (
            <Link className="btn-outline" href="/login">Login</Link>
          )}
        </div>

        <div className="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
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
            color: "#fff",
            marginBottom: "3.5rem",
            lineHeight: 1.15,
          }}>
            Built different.<br />
            <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
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
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.03)",
                transition: "border-color 0.2s, background 0.2s",
              }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "1rem", lineHeight: 1 }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  letterSpacing: "0.02em",
                  color: "#fff",
                  marginBottom: "0.5rem",
                }}>
                  {f.title}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", lineHeight: 1.65 }}>
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
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
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
              background: "radial-gradient(ellipse, rgba(20,184,166,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div className="section-label" style={{ justifyContent: "center" }}>Join the Crew</div>
            <h2 style={{
              fontFamily: "Rajdhani, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#fff",
              margin: "1rem 0",
            }}>
              Ready to build with the best?
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.5)",
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
