"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* ── Grid ── */}
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            {/* Logo wordmark */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", marginBottom: "0.75rem" }}>
              <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="footer-logo-g" cx="35%" cy="28%" r="70%">
                    <stop offset="0%" stopColor="#7ee8d6"/>
                    <stop offset="42%" stopColor="#14B8A6"/>
                    <stop offset="100%" stopColor="#0b7066"/>
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="19" fill="url(#footer-logo-g)"/>
                <polygon points="28,20 24,13.1 16,13.1 12,20 16,26.9 24,26.9"
                  fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="1.3" strokeLinejoin="round"/>
                <line x1="20" y1="15.5" x2="16.2" y2="22.2" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="20" y1="15.5" x2="23.8" y2="22.2" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="16.2" y1="22.2" x2="23.8" y2="22.2" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="20" cy="15.5" r="1.5" fill="rgba(255,255,255,0.92)"/>
                <circle cx="16.2" cy="22.2" r="1.5" fill="rgba(255,255,255,0.92)"/>
                <circle cx="23.8" cy="22.2" r="1.5" fill="rgba(255,255,255,0.92)"/>
              </svg>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--foreground)" }}>
                crewboard
              </span>
            </Link>

            <p className="footer-tagline">Web3 Freelancer Marketplace</p>

            <p className="footer-desc">
              Hire and get paid in Web3. On-chain escrow powered by Solana keeps every deal transparent and secure.
            </p>

            <div className="footer-socials">
              <a href="https://x.com/crewboard_" target="_blank" rel="noopener noreferrer" className="footer-social-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @crewboard_
              </a>
              <a href="mailto:info@crewboard.com" className="footer-social-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                info@crewboard.com
              </a>
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Explore Crewboard">
            <p className="footer-col-heading">Explore</p>
            <Link href="/talent"    className="footer-link">Browse Talent</Link>
            <Link href="/gigs"      className="footer-link">Browse Services</Link>
            <Link href="/jobs"      className="footer-link">Job Board</Link>
            <a href="#categories"   className="footer-link">Categories</a>
            <a href="#how-it-works" className="footer-link">How It Works</a>
          </nav>

          {/* Freelancers */}
          <nav aria-label="Freelancers">
            <p className="footer-col-heading">Freelancers</p>
            <Link href="/register"    className="footer-link">Join for Free</Link>
            <Link href="/gigs/new"    className="footer-link">Post a Service</Link>
            <Link href="/showcase"    className="footer-link">Showcase</Link>
            <a href="#faq"            className="footer-link">FAQ</a>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <p className="footer-col-heading">Company</p>
            <a href="mailto:info@crewboard.com" className="footer-link">About</a>
            <a href="mailto:info@crewboard.com" className="footer-link">Contact</a>
            <Link href="/privacy"  className="footer-link">Privacy Policy</Link>
            <Link href="/terms"    className="footer-link">Terms of Service</Link>
          </nav>
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 Crewboard · Built on Solana</span>
          <span className="footer-status">
            <span className="footer-status-dot" />
            All systems operational
          </span>
        </div>

      </div>

      <style>{`
        .site-footer {
          border-top: 1px solid var(--border);
          background: var(--surface);
          padding: 4rem 2rem 0;
        }
        .footer-inner { max-width: 1100px; margin: 0 auto; }

        .footer-grid {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1fr;
          gap: clamp(2rem, 4vw, 3rem);
          padding-bottom: 3rem;
        }
        @media (max-width: 860px) {
          .footer-grid { grid-template-columns: 1fr 1fr 1fr; }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 500px) {
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 340px) {
          .footer-grid { grid-template-columns: 1fr; }
        }

        .footer-brand { display: flex; flex-direction: column; }
        .footer-tagline {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--brand);
          margin-bottom: 0.65rem;
        }
        .footer-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.75;
          max-width: 270px;
          margin-bottom: 1.1rem;
        }
        .footer-socials { display: flex; flex-wrap: wrap; gap: 8px; }
        .footer-social-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.74rem; font-weight: 600;
          color: var(--text-muted); text-decoration: none;
          padding: 5px 12px; border-radius: 99px;
          border: 1px solid var(--border);
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .footer-social-pill:hover {
          color: var(--foreground);
          border-color: var(--border-md);
          background: var(--bg-secondary);
        }

        .footer-col-heading {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0 0 0.85rem;
        }
        .footer-link {
          display: block;
          font-size: 0.83rem;
          color: var(--text-muted);
          text-decoration: none;
          padding: 0.22rem 0;
          line-height: 1.8;
          transition: color 0.15s;
        }
        .footer-link:hover { color: var(--foreground); }

        .footer-bottom {
          border-top: 1px solid var(--border);
          padding: 1.3rem 0 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .footer-copy {
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }
        .footer-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.7rem; font-weight: 500; color: var(--text-muted);
        }
        .footer-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22c55e; flex-shrink: 0;
        }
      `}</style>
    </footer>
  );
}
