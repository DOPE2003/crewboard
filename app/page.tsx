// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container" style={{ position: "relative", zIndex: 1 }}>
      {/* HERO */}
      <section className="hero" style={{ paddingTop: 36 }}>
        <div className="hero-grid">
          {/* LEFT */}
          <div className="hero-left">
            <div className="pill">
              <span className="dot" />
              Solana-first marketplace — proof, reputation, fast matching
            </div>

            <h1 className="hero-title">
              Hire Web3 talent <br /> without guessing.
            </h1>

            <p className="hero-sub">
              Crewboard is your on-chain style hiring board for mods, artists, community ops,
              shillers, devs — with proof, reputation and fast matching.
            </p>

            <div className="chips" style={{ marginTop: 14 }}>
              <span className="chip">⚡ Solana-first</span>
              <span className="chip">🧾 Proof of work</span>
              <span className="chip">⭐ Ratings</span>
              <span className="chip">🧩 Teams &amp; projects</span>
            </div>

            <div className="nav-actions" style={{ marginTop: 16 }}>
              <Link className="btn btn-primary" href="/talent">
                Browse talent
              </Link>
              <Link className="btn btn-ghost" href="/projects">
                Browse projects
              </Link>
              <Link className="btn btn-ghost" href="/login">
                Create account
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-num">Fast hiring</div>
                <div className="stat-label">Search → shortlist → DM</div>
              </div>
              <div className="stat">
                <div className="stat-num">Better trust</div>
                <div className="stat-label">Ratings + verified links</div>
              </div>
              <div className="stat">
                <div className="stat-num">Team-ready</div>
                <div className="stat-label">Projects post roles</div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-right">
            <div className="glass-card">
              <div className="card-top">
                <div className="avatar" />
                <div className="card-meta">
                  <div className="card-name">Blueprint MVP</div>
                  <div className="card-sub">UI first • auth ready • next: profiles</div>
                </div>
                <div className="badge">Live</div>
              </div>

              <div className="chips">
                <span className="chip">Email magic link</span>
                <span className="chip">Next: X login</span>
                <span className="chip">Next: Wallet</span>
                <span className="chip">Next: Ratings</span>
              </div>

              <div className="card-cta">
                <Link className="btn btn-ghost" href="/projects">
                  View projects
                </Link>
                <Link className="btn btn-primary" href="/login">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="floating">
              <div className="float-item">
                <div className="mini-dot" />
                Today we use <b>email sign-in</b> (magic link)
              </div>
              <div className="float-item">
                <div className="mini-dot" />
                Later: <b>X login</b> + <b>wallet verification</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED TALENT */}
      <div
        style={{
          marginTop: 26,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2 style={{ letterSpacing: "-0.02em", margin: 0 }}>
          Featured talent
        </h2>
        <Link href="/talent" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          View all →
        </Link>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <Link href="/talent" className="glass-card" style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Community Moderator</div>
              <div className="card-sub" style={{ marginTop: 6 }}>
                Telegram ops • Discord ops • Raid squads
              </div>
              <div className="chips" style={{ marginTop: 10 }}>
                <span className="chip">⭐ 4.9</span>
                <span className="chip">⏱ 2+ yrs</span>
                <span className="chip">💸 400–800/wk</span>
              </div>
            </div>
            <span className="chip">Hot</span>
          </div>
        </Link>

        <Link href="/talent" className="glass-card" style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Designer / Artist</div>
              <div className="card-sub" style={{ marginTop: 6 }}>
                PFPs • banners • motion • meme kits
              </div>
              <div className="chips" style={{ marginTop: 10 }}>
                <span className="chip">⭐ 4.8</span>
                <span className="chip">🎨 Portfolio</span>
                <span className="chip">💸 200–600</span>
              </div>
            </div>
            <span className="chip">Pro</span>
          </div>
        </Link>
      </div>

      {/* FEATURED PROJECTS */}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2 style={{ letterSpacing: "-0.02em", margin: 0 }}>
          Featured projects
        </h2>
        <Link href="/projects" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          View all →
        </Link>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <Link href="/projects" className="glass-card" style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Token Launch Team</div>
              <div className="card-sub" style={{ marginTop: 6 }}>
                Hiring: Mods + X hypers
              </div>
              <div className="chips" style={{ marginTop: 10 }}>
                <span className="chip">🧩 2 roles</span>
                <span className="chip">🕒 2 weeks</span>
                <span className="chip">Budget: 600–1200</span>
              </div>
            </div>
            <span className="chip">Hiring</span>
          </div>
        </Link>

        <Link href="/projects" className="glass-card" style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>NFT / Brand</div>
              <div className="card-sub" style={{ marginTop: 6 }}>
                Hiring: Artist + Animator
              </div>
              <div className="chips" style={{ marginTop: 10 }}>
                <span className="chip">🎨 1 role</span>
                <span className="chip">🕒 1 week</span>
                <span className="chip">Budget: 300–900</span>
              </div>
            </div>
            <span className="chip">Active</span>
          </div>
        </Link>
      </div>

      {/* FOOTER */}
      <div style={{ margin: "34px 0 50px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
        Crewboard • Blueprint UI • MVP — next: profiles + ratings + X login + wallet
      </div>
    </main>
  );
}
