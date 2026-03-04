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

  const topBuilders = await db.user.findMany({
    where: { profileComplete: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { twitterHandle: true, name: true, image: true, role: true, skills: true },
  }).catch(() => []);

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

        {/* Glow behind hero text */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
          width: "clamp(360px, 60vw, 720px)",
          height: "clamp(200px, 30vw, 380px)",
          background: "radial-gradient(ellipse at center, rgba(45,212,191,0.18) 0%, rgba(20,184,166,0.10) 35%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(18px)",
        }} />

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

        {/* Teal glow strip behind headline */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #2DD4BF 30%, #14b8a6 50%, #2DD4BF 70%, transparent 100%)",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Headline */}
        <h1 className="hero-h1" style={{
          fontFamily: "Rajdhani, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.01em",
          lineHeight: 0.93,
          marginBottom: "2rem",
          color: "#000",
          opacity: 0,
          animation: "fadeUp 0.6s 0.25s forwards",
          position: "relative",
          zIndex: 1,
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

        {/* Mobile search bar — hidden on desktop */}
        <form action="/talent" method="get" className="hero-mobile-search" style={{
          opacity: 0,
          animation: "fadeUp 0.6s 0.62s forwards",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            name="q"
            placeholder="Search talent..."
            autoComplete="off"
          />
        </form>

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
          {/* Stats row */}
          <div className="hero-stats-row" style={{
            display: "flex",
            gap: "4rem",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "2rem",
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
          <div className="scroll-line" />
        </div>
      </div>

      {/* ── TOP FREELANCERS ── */}
      {topBuilders.length > 0 && (
        <div style={{ padding: "4rem 2rem 2rem", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "2rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}>
              <div>
                <div className="section-label">Most Searched</div>
                <h2 style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  color: "#000",
                  lineHeight: 1.1,
                }}>
                  Top Freelancers
                </h2>
              </div>
              <Link href="/talent" style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "0.82rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#2DD4BF",
                textDecoration: "none",
              }}>
                View all →
              </Link>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
            }}>
              {topBuilders.map((u) => (
                <Link key={u.twitterHandle} href={`/u/${u.twitterHandle}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "1.25rem",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.08)",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: "0.5rem",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}>
                    {u.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={u.image} alt="" width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(0,0,0,0.08)" }} />
                    )}
                    <div style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#000",
                      lineHeight: 1.2,
                    }}>
                      {u.name ?? u.twitterHandle}
                    </div>
                    {u.role && (
                      <div style={{
                        fontFamily: "Space Mono, monospace",
                        fontSize: "0.58rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#2DD4BF",
                        fontWeight: 600,
                      }}>
                        {u.role}
                      </div>
                    )}
                    {u.skills.length > 0 && (
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", justifyContent: "center" }}>
                        {u.skills.slice(0, 3).map((s) => (
                          <span key={s} style={{
                            fontFamily: "Space Mono, monospace",
                            fontSize: "0.52rem",
                            padding: "0.2rem 0.5rem",
                            borderRadius: 999,
                            background: "rgba(0,0,0,0.05)",
                            color: "rgba(0,0,0,0.55)",
                          }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(0,0,0,0.08)",
        padding: "3rem 2rem 2rem",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          {/* Top row */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "2rem",
            marginBottom: "2.5rem",
          }}>
            {/* Brand */}
            <div>
              <div style={{
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "1.2rem",
                letterSpacing: "0.05em",
                color: "#000",
                marginBottom: "0.4rem",
              }}>
                CREWBOARD
              </div>
              <div style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.08em",
                color: "rgba(0,0,0,0.4)",
                maxWidth: "18rem",
                lineHeight: 1.6,
              }}>
                The professional network for Web3 builders.
              </div>
            </div>

            {/* Nav links */}
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {[
                { label: "Talent", href: "/talent" },
                { label: "Projects", href: "/projects" },
                { label: "Whitepaper", href: "/whitepaper" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((l) => (
                <Link key={l.label} href={l.href} style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(0,0,0,0.5)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* X / Twitter */}
            <a
              href="https://x.com/crewboard_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontFamily: "Rajdhani, sans-serif",
                fontWeight: 700,
                fontSize: "0.82rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#000",
                textDecoration: "none",
                padding: "0.5rem 1rem",
                border: "1.5px solid rgba(0,0,0,0.55)",
                borderRadius: "999px",
                transition: "background 0.2s",
              }}
            >
              {/* X icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @crewboard_
            </a>
          </div>

          {/* Bottom row */}
          <div style={{
            borderTop: "1px solid rgba(0,0,0,0.06)",
            paddingTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}>
            <span style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              color: "rgba(0,0,0,0.35)",
            }}>
              © 2026 Crewboard ·{" "}
              <Link href="/terms" style={{ color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>Terms</Link>
              {" "}·{" "}
              <Link href="/privacy" style={{ color: "rgba(0,0,0,0.35)", textDecoration: "none" }}>Privacy</Link>
            </span>

            <span style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              color: "rgba(0,0,0,0.35)",
            }}>
              BUILT BY{" "}
              <a
                href="https://x.com/SAAD190914"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2DD4BF", fontWeight: 700, textDecoration: "none" }}
              >
                TEJO
              </a>
            </span>
          </div>

        </div>
      </footer>

    </main>
  );
}
