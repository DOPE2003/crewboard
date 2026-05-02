"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <footer style={{
      borderTop: "1px solid var(--card-border)",
      background: "var(--background)",
      padding: "3rem 2rem 0",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Top row: 3 columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "clamp(1.5rem, 4vw, 3rem)",
          marginBottom: "2.5rem",
        }} className="footer-cols">

          {/* Left: Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {/* Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" style={{ width: 140, height: 35, color: "var(--foreground)" }}>
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

            <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#14B8A6", fontWeight: 600 }}>
              Web3 Freelancer Marketplace
            </span>

            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.7, margin: "0.25rem 0 0.75rem", maxWidth: 280 }}>
              Hire and get paid in Web3. On-chain escrow powered by Solana keeps every deal secure and transparent.
            </p>

            {/* Email */}
            <a
              href="mailto:info@crewboard.com"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "0.72rem", fontWeight: 500, color: "var(--text-muted)",
                textDecoration: "none",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              info@crewboard.com
            </a>

            {/* Twitter */}
            <a
              href="https://x.com/crewboard_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)",
                textDecoration: "none", width: "fit-content",
                padding: "4px 12px", borderRadius: 99,
                border: "1px solid var(--card-border)",
                marginTop: "0.25rem",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @crewboard_
            </a>
          </div>

          {/* Middle: Explore */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Explore
            </div>
            <Link href="/talent" className="footer-nav-link">Browse Talent</Link>
            <a href="#categories" className="footer-nav-link">Categories</a>
            <a href="#how-it-works" className="footer-nav-link">How It Works</a>
            <Link href="/gigs/new" className="footer-nav-link">Post a Service</Link>
          </div>

          {/* Right: Company */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              Company
            </div>
            <a href="#trust" className="footer-nav-link">About</a>
            <a href="mailto:info@crewboard.com" className="footer-nav-link">Contact</a>
            <Link href="/privacy" className="footer-nav-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-nav-link">Terms of Service</Link>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid var(--card-border)",
          padding: "1.25rem 0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            © 2026 Crewboard · Built on Solana
          </span>
        </div>

      </div>

      <style>{`
        .footer-cols { grid-template-columns: 2fr 1fr 1fr; }
        @media (max-width: 720px) { .footer-cols { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .footer-cols { grid-template-columns: 1fr; } }
        .footer-nav-link {
          font-size: 0.78rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-nav-link:hover { color: var(--foreground); }
      `}</style>
    </footer>
  );
}
