export default function WhitepaperPage() {
  return (
    <div className="page whitepaper">
      {/* HERO */}
      <div className="hero">
        <div className="hero-tag">Whitepaper · 2026</div>
        <h1 className="hero-logo" style={{ fontWeight: 300, fontSize: "clamp(2rem, 7vw, 5rem)" }}>
          The Protocol<br />for Web3 Talent
        </h1>
        <p className="hero-tagline">
          Connecting talents. Building crews. The future of collaboration is here.
        </p>

        <div className="hero-btns">
          <a href="#challenge" className="btn-primary">Read Whitepaper</a>
          <a href="#invest" className="btn-outline">Investor Access</a>
        </div>

        <div className="scroll-hint">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </div>

      {/* CHALLENGE */}
      <section id="challenge">
        <div className="section-label">01 / The Challenge</div>
        <h2 className="section-title">
          Building in Web3 is complex.<br />Finding the right team is harder.
        </h2>
        <p className="section-body">
          The Web3 sector is booming — yet talent acquisition remains fragmented and high-risk.
          No unified, trustworthy platform exists. Current solutions lack verification, escrow
          payments, and Web3-native features.
        </p>

        <div className="challenge-grid">
          <div className="challenge-card">
            <h3>No Verification</h3>
            <p>Anonymous profiles lead to scams and unqualified applicants with zero accountability.</p>
          </div>
          <div className="challenge-card">
            <h3>Payment Risk</h3>
            <p>Freelancers risk non-payment; projects risk incomplete delivery with no protection.</p>
          </div>
          <div className="challenge-card">
            <h3>Centralized</h3>
            <p>Traditional platforms have no integration with Web3-native wallets or smart contracts.</p>
          </div>
          <div className="challenge-card">
            <h3>No Mobile</h3>
            <p>A fast-moving market demands real-time updates — existing tools aren&apos;t built for speed.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* DIAGRAM 1 */}
      <section id="flow1">
        <div className="section-label">02 / How It Works — Client</div>
        <h2 className="section-title">
          From idea to delivered work.<br />End to end.
        </h2>
        <p className="section-body">
          Crewboard walks you through every step — from the moment you have an idea to the moment
          your designer delivers and gets paid. Secure, transparent, instant.
        </p>

        <div className="diagram-wrap">
          <div className="diagram-title">Fig. 1 — Client Booking &amp; Payment Flow</div>
          <div className="flow">

            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">You Have an Idea</div>
                <div className="node-sub">Project starts here</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">search</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Browse Designers</div>
                <div className="node-sub">Filter by skill &amp; proof</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">select</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Find the Right One</div>
                <div className="node-sub">Verified profiles only</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">book</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Book &amp; Escrow</div>
                <div className="node-sub">Funds held securely</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">delivery</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Work Delivered</div>
                <div className="node-sub">Review &amp; approve</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">release</div>
            </div>

            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">Payment Released</div>
                <div className="node-sub">Auto on approval</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="divider" />

      {/* DIAGRAM 2 */}
      <section id="flow2">
        <div className="section-label">03 / Verification System</div>
        <h2 className="section-title">
          Real people. Proven work.<br />Trusted profiles.
        </h2>
        <p className="section-body">
          Every talent goes through a strict process — identity confirmed, past work verified on-chain or by link.
          Clients instantly know you&apos;re the real deal. The badge speaks for itself.
        </p>

        <div className="diagram-wrap">
          <div className="diagram-title">Fig. 2 — Talent Verification Flow</div>
          <div className="flow">
            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">Create Account</div>
                <div className="node-sub">Name, wallet, socials</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">submit</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Verify Identity</div>
                <div className="node-sub">Prove you are real</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">upload</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Previous Work</div>
                <div className="node-sub">GitHub, NFTs, DAOs</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">review</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Platform Review</div>
                <div className="node-sub">Manual + on-chain check</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">approve</div>
            </div>

            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">Verified Badge</div>
                <div className="node-sub">Shown on your profile</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">result</div>
            </div>

            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">Clients Trust You</div>
                <div className="node-sub">More bookings, higher rates</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* DIAGRAM 3 */}
      <section id="flow3">
        <div className="section-label">04 / For Builders</div>
        <h2 className="section-title">
          You&apos;re a dev with a vision.<br />Build your crew here.
        </h2>
        <p className="section-body">
          Already shipping in Web3? Use Crewboard to assemble your next project team — whether you&apos;re building
          a meme token, a utility protocol, or an AI agent. Find and book every role you need in minutes.
        </p>

        <div className="diagram-wrap">
          <div className="diagram-title">Fig. 3 — Developer Team Assembly Flow</div>
          <div className="flow">
            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">Successful Dev</div>
                <div className="node-sub">You ship in Web3</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">next step</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">New Project</div>
                <div className="node-sub">Need a full crew</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">decide</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Pick Project Type</div>
                <div className="node-sub">Meme · Utility · AI</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">search</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Find Talent</div>
                <div className="node-sub">Designers, Raiders, KOLs</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">book</div>
            </div>

            <div className="flow-node">
              <div className="node-box">
                <div className="node-title">Book Each Role</div>
                <div className="node-sub">Escrow per member</div>
              </div>
            </div>

            <div className="flow-arrow">
              <div className="arrow-shaft"><div className="a-line" /><div className="a-head" /></div>
              <div className="a-label">launch</div>
            </div>

            <div className="flow-node">
              <div className="node-box hl">
                <div className="node-title">Ship Together</div>
                <div className="node-sub">Full crew assembled</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* SOLUTION */}
      <section id="solution">
        <div className="section-label">05 / The Solution</div>
        <h2 className="section-title">
          One platform. Every role.<br />Full Web3 stack.
        </h2>
        <p className="section-body">
          Built in collaboration with jellyjelly and wobbles devs — designed from the ground up for the Web3 market,
          combining verification, escrow, and smart matching in one cohesive product.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">✦</span>
            <h3>Strict Verification</h3>
            <p>Profiles require verifiable proof of past work — GitHub, NFT collections, DAO contributions, smart contracts. No anonymous actors.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Direct Booking</h3>
            <p>Search by skill and book in one click. Smart matching connects you instantly with the right dev, designer, or marketer.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Escrow Payments</h3>
            <p>Crypto-native escrow holds funds and releases only after successful delivery and approval — protecting both sides.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🌐</span>
            <h3>Team &amp; Investor Hub</h3>
            <p>Anyone with an idea can build a team or attract investors — a true one-stop hub for Web3 project creation.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ROADMAP */}
      <section id="roadmap">
        <div className="section-label">06 / Roadmap</div>
        <h2 className="section-title">The network is live.<br />Here&apos;s what&apos;s next.</h2>

        <div className="roadmap">
          <div className="roadmap-line" />

          <div className="roadmap-item">
            <div className="roadmap-dot" />
            <div className="roadmap-period">Q1–Q2 2026</div>
            <div className="roadmap-desc">
              <h4>MVP Launch</h4>
              <p>Core platform with jellyjelly &amp; wobbles devs. Beta launch with verification and escrow payment infrastructure.</p>
            </div>
          </div>

          <div className="roadmap-item">
            <div className="roadmap-dot" />
            <div className="roadmap-period">Q3 2026</div>
            <div className="roadmap-desc">
              <h4>Advanced Matching</h4>
              <p>Enhanced search, AI-assisted smart matching, first strategic partnerships with Web3 projects and DAOs.</p>
            </div>
          </div>

          <div className="roadmap-item">
            <div className="roadmap-dot" />
            <div className="roadmap-period">Q4 2026</div>
            <div className="roadmap-desc">
              <h4>Mobile App + Token Prep</h4>
              <p>iOS &amp; Android release with real-time notifications. Private fundraising round preparation begins.</p>
            </div>
          </div>

          <div className="roadmap-item">
            <div className="roadmap-dot" />
            <div className="roadmap-period">2027+</div>
            <div className="roadmap-desc">
              <h4>Global Expansion</h4>
              <p>AI-enhanced matching, deeper governance features, native token launch, and international market penetration.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* BUSINESS MODEL */}
      <section id="invest">
        <div className="section-label">07 / Business Model</div>
        <h2 className="section-title">
          Transparent. Pay-per-use.<br />No subscriptions.
        </h2>
        <p className="section-body">
          Financed through a booking fee per successful transaction. Future phases introduce a native utility token with staking,
          governance rights, and rewards — preceded by a private fundraising round.
        </p>

        <div className="model-row">
          <div className="model-card">
            <div className="stat">5–10%</div>
            <p>Transaction fee per successful booking. Simple monetization aligned with successful delivery.</p>
          </div>
          <div className="model-card">
            <div className="stat">$39B+</div>
            <p>Projected global blockchain market by 2026. Crewboard targets the critical talent bottleneck inside this ecosystem.</p>
          </div>
          <div className="model-card">
            <div className="stat" style={{ fontSize: "1.4rem" }}>Private Round</div>
            <p>A private fundraising round precedes the native token launch — accelerating development and ecosystem growth.</p>
          </div>
          <div className="model-card">
            <div className="stat" style={{ fontSize: "1.4rem" }}>Native Token</div>
            <p>Future utility token with staking for fee discounts, governance rights, and rewards for verified contributors.</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* CTA */}
      <div className="cta-section">
        <h2>Form your ultimate crew.</h2>
        <p>
          For investors, developers, and creators — this is your opportunity to be part of the infrastructure
          powering the next wave of Web3 innovation.
        </p>

        <div className="hero-btns">
          <a href="#" className="btn-primary">Request Early Access</a>
          <a href="#" className="btn-outline">Partner With Us</a>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">CREWBOARD</div>
        <p>© 2026 Crewboard · Connecting talents. Building crews. · The Future of Collaboration Is Here</p>
      </footer>
    </div>
  );
}