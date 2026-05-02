import Link from "next/link";

export const metadata = { title: "Privacy Policy — Crewboard" };

const SECTIONS = [
  "What We Collect",
  "How We Use Your Data",
  "Authentication via X",
  "Wallet Address",
  "On-Chain Data",
  "Messages & Files",
  "Public Profile Data",
  "Cookies & Sessions",
  "Analytics",
  "Data Storage & Security",
  "Third-Party Services",
  "Your Rights",
  "Children's Privacy",
  "Changes to This Policy",
  "Contact",
];

export default function PrivacyPage() {
  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.75rem" }}>
            Legal
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", alignItems: "start" }} className="legal-grid">
          <style>{`
            @media (max-width: 768px) {
              .legal-grid { grid-template-columns: 1fr !important; }
              .legal-toc { display: none !important; }
            }
          `}</style>

          {/* Sticky TOC */}
          <div className="legal-toc" style={{ position: "sticky", top: "5.5rem", borderRadius: 14, border: "1px solid var(--card-border)", background: "var(--card-bg)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.6rem" }}>Contents</div>
            {SECTIONS.map((s, i) => (
              <a key={i} href={`#s${i + 1}`} style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", padding: "3px 0", lineHeight: 1.4, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#14b8a6")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                <span style={{ color: "#14b8a6", fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>{s}
              </a>
            ))}
          </div>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>

            <Section id="s1" num={1} title="What We Collect">
              When you sign in with X (Twitter), we receive your public profile information: display name, X handle, and profile picture. We store this to power your public Crewboard profile. We also store information you voluntarily provide during onboarding and profile setup — role, skills, bio, availability status, CV/portfolio URL, and profile media uploads. If you connect a Solana wallet, we store your public wallet address. We store all messages you send and receive on the platform, including file and media attachments. We track profile view counts per user. We collect standard server logs including IP addresses and request metadata for security and debugging purposes.
            </Section>

            <Section id="s2" num={2} title="How We Use Your Data">
              Your data is used solely to operate the Crewboard platform: displaying your public profile, showing you in the talent directory, processing orders and payments, facilitating messaging between users, and enabling dispute resolution. We do not sell your data to third parties. We do not use your data for advertising.
            </Section>

            <Section id="s3" num={3} title="Authentication via X">
              We use X (Twitter) OAuth 2.0 for authentication. We do not store your X password. OAuth tokens are used only to verify your identity at sign-in. You can revoke Crewboard&apos;s access at any time from your X account settings, which will invalidate your session.
            </Section>

            <Section id="s4" num={4} title="Wallet Address">
              If you connect a Solana wallet, your public wallet address is stored in our database and displayed on your profile. Your wallet address is a public identifier on the Solana blockchain — Crewboard does not have access to your private keys or the ability to initiate transactions on your behalf. All on-chain transactions require your explicit approval via your wallet.
            </Section>

            <Section id="s5" num={5} title="On-Chain Data">
              Transactions processed through Crewboard&apos;s escrow smart contracts are recorded permanently on the Solana blockchain. This data is public and immutable — it cannot be deleted or modified by Crewboard or by you. This includes transaction amounts, wallet addresses, and timestamps.
            </Section>

            <Section id="s6" num={6} title="Messages & Files">
              All messages sent through Crewboard&apos;s messaging system, including text, files, and media, are stored in our database. Message content is used to facilitate communication between users and to support dispute resolution when required. We do not sell or share message content with third parties.
            </Section>

            <Section id="s7" num={7} title="Public Profile Data">
              Your name, X handle, role, skills, bio, availability, and profile picture are publicly visible on Crewboard by default. This is core to the platform&apos;s function of connecting clients and freelancers. If you wish to remove your public profile, contact us to delete your account.
            </Section>

            <Section id="s8" num={8} title="Cookies & Sessions">
              We use secure, HTTP-only session cookies to keep you logged in. These cookies do not track you across other websites. We do not use third-party advertising cookies.
            </Section>

            <Section id="s9" num={9} title="Analytics">
              We use Vercel Analytics to collect anonymised, aggregated usage data (page views, navigation patterns). This data does not include personally identifiable information and is used solely to improve the platform.
            </Section>

            <Section id="s10" num={10} title="Data Storage & Security">
              Your data is stored on Neon Postgres, a cloud database provider. Data is encrypted at rest and in transit. We retain your data for as long as your account is active. Upon account deletion, your personal data is permanently removed from our database within 30 days. Note that on-chain data cannot be deleted (see Section 5).
            </Section>

            <Section id="s11" num={11} title="Third-Party Services">
              Crewboard integrates with: X (Twitter) for authentication; Neon for database hosting; Vercel for hosting and analytics; Solana blockchain infrastructure for on-chain escrow. Beyond these, we do not share your data with third parties.
            </Section>

            <Section id="s12" num={12} title="Your Rights">
              You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us via X. We will respond within 30 days. Note that on-chain blockchain data is outside our ability to modify or delete.
            </Section>

            <Section id="s13" num={13} title="Children's Privacy">
              Crewboard is not directed at children under 18. We do not knowingly collect personal information from minors. If we become aware of such data, it will be promptly deleted.
            </Section>

            <Section id="s14" num={14} title="Changes to This Policy">
              We may update this Privacy Policy from time to time. We will notify users of significant changes via a notice on the platform. Continued use after changes constitutes acceptance of the updated policy.
            </Section>

            <Section id="s15" num={15} title="Contact">
              Privacy questions or data requests? Reach us on X at{" "}
              <a href="https://x.com/crewboard_" target="_blank" rel="noopener noreferrer" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>@crewboard_</a>.
            </Section>

            <div style={{ paddingTop: "2rem", borderTop: "1px solid var(--card-border)" }}>
              <Link href="/" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textDecoration: "none" }}>← Back to Crewboard</Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ id, num, title, children }: { id: string; num: number; title: string; children: React.ReactNode }) {
  return (
    <div id={id} style={{ scrollMarginTop: "6rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#14b8a6", letterSpacing: "0.08em" }}>{num}.</span>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.85, margin: 0 }}>
        {children}
      </p>
    </div>
  );
}
