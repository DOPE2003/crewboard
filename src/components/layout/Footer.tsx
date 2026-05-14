"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      padding: "3.5rem 2rem 0",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Top row: brand + 3 link columns */}
        <div className="footer-cols" style={{ marginBottom: "3rem" }}>

          {/* Brand column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {/* Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" style={{ width: 144, height: 36, color: "var(--foreground)" }}>
              <polygon points="124,80 98,125 46,125 20,80 46,35 98,35" fill="none" stroke="currentColor" strokeWidth="4.4" strokeLinejoin="round"/>
              <line x1="72" y1="54" x2="52" y2="94" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
              <line x1="72" y1="54" x2="92" y2="94" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
              <line x1="52" y1="94" x2="92" y2="94" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"/>
              <circle cx="72" cy="54" r="6.4" fill="currentColor"/>
              <circle cx="52" cy="94" r="6.4" fill="currentColor"/>
              <circle cx="92" cy="94" r="6.4" fill="currentColor"/>
              <text x="152" y="102" fill="currentColor" style={{ fontFamily: "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif", fontSize: 68, letterSpacing: -2.4 }}>
                <tspan fontWeight="300">crew</tspan><tspan fontWeight="600">board</tspan>
              </text>
            </svg>

            <span style={{
              fontSize: "0.63rem", letterSpacing: "0.13em",
              textTransform: "uppercase", color: "#14B8A6", fontWeight: 600,
              marginTop: "0.1rem",
            }}>
              Web3 Freelancer Marketplace
            </span>

            <p style={{
              fontSize: "0.78rem", color: "var(--text-muted)",
              lineHeight: 1.75, margin: "0.2rem 0 0.8rem", maxWidth: 260,
            }}>
              Hire and get paid in Web3. On-chain escrow powered by Solana keeps every deal secure and transparent.
            </p>

            {/* Social links */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <a
                href="https://x.com/crewboard_"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-btn"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @crewboard_
              </a>
              <a href="mailto:info@crewboard.com" className="footer-social-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                info@crewboard.com
              </a>
            </div>
          </div>

          {/* Explore */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="footer-col-heading">Explore</div>
            <Link href="/talent" className="footer-nav-link">Browse Talent</Link>
            <Link href="/gigs" className="footer-nav-link">Browse Services</Link>
            <a href="#categories" className="footer-nav-link">Categories</a>
            <a href="#how-it-works" className="footer-nav-link">How It Works</a>
            <Link href="/gigs/new" className="footer-nav-link">Post a Service</Link>
            <Link href="/jobs" className="footer-nav-link">Job Board</Link>
          </div>

          {/* For Freelancers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="footer-col-heading">Freelancers</div>
            <Link href="/register" className="footer-nav-link">Join for Free</Link>
            <Link href="/onboarding" className="footer-nav-link">Complete Profile</Link>
            <Link href="/showcase" className="footer-nav-link">Showcase</Link>
            <a href="#faq" className="footer-nav-link">FAQ</a>
          </div>

          {/* Company */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="footer-col-heading">Company</div>
            <a href="mailto:info@crewboard.com" className="footer-nav-link">About</a>
            <a href="mailto:info@crewboard.com" className="footer-nav-link">Contact</a>
            <Link href="/privacy" className="footer-nav-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-nav-link">Terms of Service</Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid var(--border)",
          padding: "1.25rem 0 1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            © 2026 Crewboard · Built on Solana
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: "0.68rem", fontWeight: 500, color: "var(--text-muted)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#22c55e", display: "inline-block",
              }} />
              All systems operational
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .footer-cols {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr 1fr;
          gap: clamp(1.5rem, 3vw, 2.5rem);
        }
        @media (max-width: 900px) {
          .footer-cols { grid-template-columns: 1fr 1fr 1fr; }
          .footer-cols > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 520px) {
          .footer-cols { grid-template-columns: 1fr 1fr; }
          .footer-cols > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 360px) {
          .footer-cols { grid-template-columns: 1fr; }
        }
        .footer-col-heading {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .footer-nav-link {
          font-size: 0.82rem;
          color: var(--text-muted);
          text-decoration: none;
          padding: 0.15rem 0;
          transition: color 0.15s;
          line-height: 1.8;
        }
        .footer-nav-link:hover { color: var(--foreground); }
        .footer-social-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          padding: 5px 13px;
          border-radius: 99px;
          border: 1px solid var(--border);
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .footer-social-btn:hover {
          color: var(--foreground);
          border-color: var(--border-md);
          background: var(--bg-secondary);
        }
      `}</style>
    </footer>
  );
}
