"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      background: "var(--bg)",
      padding: "3rem 2.5rem 2rem",
      position: "relative",
      zIndex: 1,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" style={{ width: 150, height: 38, color: "var(--text)" }}>
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
            <span style={{ fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#2DD4BF", fontWeight: 500 }}>
              {t("nav.tagline")}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", color: "var(--muted)", marginTop: "0.15rem", lineHeight: 1.6 }}>
              {t("footer.tagline")}
            </span>

            {/* Email */}
            <a
              href="mailto:info@crewboard.com"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.45rem",
                fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: "0.62rem",
                letterSpacing: "0.04em", color: "var(--muted)", textDecoration: "none",
                marginTop: "0.25rem",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              info@crewboard.com
            </a>

            {/* X handle */}
            <a
              href="https://x.com/crewboard_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.45rem",
                fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "0.65rem",
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--text)", textDecoration: "none",
                padding: "0.4rem 0.85rem", border: "1.5px solid var(--border)",
                borderRadius: "999px", marginTop: "0.5rem",
                width: "fit-content", transition: "border-color 0.2s",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @crewboard_
            </a>
          </div>

          {/* Links columns */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.56rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.2rem" }}>
                {t("footer.platform")}
              </div>
              <Link href="/talent" className="footer-link">{t("footer.browseTalent")}</Link>
              <Link href="/gigs" className="footer-link">{t("footer.gigs")}</Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.56rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.2rem" }}>
                {t("footer.resources")}
              </div>
              <Link href="/whitepaper" className="footer-link">{t("footer.whitepaper")}</Link>
              <Link href="/help" className="footer-link">{t("footer.help")}</Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.56rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.2rem" }}>
                {t("footer.legal")}
              </div>
              <Link href="/privacy" className="footer-link">{t("footer.privacy")}</Link>
              <Link href="/terms" className="footer-link">{t("footer.terms")}</Link>
            </div>

          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--muted)" }}>
            © {new Date().getFullYear()} Crewboard ·{" "}
            <Link href="/terms" style={{ color: "var(--muted)", textDecoration: "none" }}>Terms</Link>
            {" "}·{" "}
            <Link href="/privacy" style={{ color: "var(--muted)", textDecoration: "none" }}>Privacy</Link>
          </span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.6rem", letterSpacing: "0.08em", color: "var(--muted)" }}>
            BUILT BY{" "}
            <a href="https://x.com/SAAD190914" target="_blank" rel="noopener noreferrer"
              style={{ color: "#2DD4BF", fontWeight: 700, textDecoration: "none" }}>
              TEJO
            </a>
          </span>
        </div>

      </div>
    </footer>
  );
}
