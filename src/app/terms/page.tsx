import Link from "next/link";

export const metadata = { title: "Terms of Service — Crewboard" };

const SECTIONS = [
  "Acceptance of Terms",
  "Eligibility",
  "Accounts & Authentication",
  "Platform Fee",
  "Escrow & Payments",
  "Blockchain & Crypto Risk",
  "Wallet Ownership",
  "Order Completion & Delivery",
  "Disputes",
  "Non-Circumvention",
  "User Content",
  "Prohibited Services",
  "Acceptable Use",
  "Taxes",
  "Account Suspension & Termination",
  "Intellectual Property",
  "Disclaimer of Warranties",
  "Limitation of Liability",
  "Governing Law",
  "Contact",
];

export default function TermsPage() {
  return (
    <main style={{ background: "var(--background)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#14b8a6", marginBottom: "0.75rem" }}>
            Legal
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Terms of Service
          </h1>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem", alignItems: "start" }} className="legal-grid">
          <style>{`
            @media (max-width: 768px) {
              .legal-grid { grid-template-columns: 1fr !important; }
              .legal-toc { display: none !important; }
            }
            .legal-toc a:hover { color: #14b8a6 !important; }
          `}</style>

          {/* Sticky TOC */}
          <div className="legal-toc" style={{ position: "sticky", top: "5.5rem", borderRadius: 14, border: "1px solid var(--card-border)", background: "var(--card-bg)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.6rem" }}>Contents</div>
            {SECTIONS.map((s, i) => (
              <a key={i} href={`#s${i + 1}`} style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", padding: "3px 0", lineHeight: 1.4, transition: "color 0.15s" }}>
                <span style={{ color: "#14b8a6", fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>{s}
              </a>
            ))}
          </div>

          {/* Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>

            <Section id="s1" num={1} title="Acceptance of Terms">
              By accessing or using Crewboard, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform. Crewboard reserves the right to update these terms at any time; continued use constitutes acceptance of any changes.
            </Section>

            <Section id="s2" num={2} title="Eligibility">
              You must be at least 18 years old to use Crewboard. By creating an account, you confirm that you meet this requirement, that the information you provide is accurate and complete, and that you have the legal capacity to enter into binding agreements.
            </Section>

            <Section id="s3" num={3} title="Accounts & Authentication">
              Crewboard uses X (Twitter) OAuth for authentication. Your X handle becomes your public identity on the platform. You are responsible for all activity under your account. Do not share your session or attempt to impersonate another user. Crewboard reserves the right to suspend or terminate accounts that violate these terms.
            </Section>

            <Section id="s4" num={4} title="Platform Fee" highlight>
              Crewboard charges a 10% platform fee on the gross value of every completed order. This fee is deducted from the seller&apos;s (freelancer&apos;s) payout at the time of escrow release. The buyer pays the full agreed order amount; the seller receives 90% of that amount. By using Crewboard&apos;s order and escrow system, both parties agree to this fee structure.
            </Section>

            <Section id="s5" num={5} title="Escrow & Payments">
              Payments on Crewboard are processed through non-custodial smart contracts on the Solana blockchain. When a buyer funds an order, their payment is locked in escrow on-chain. Funds are released to the seller only when the buyer explicitly approves delivery, or through dispute resolution. Crewboard facilitates but is not a party to transactions between users. You are solely responsible for ensuring you transact with the correct wallet addresses. Crewboard cannot reverse, cancel, or modify on-chain transactions once executed.
            </Section>

            <Section id="s6" num={6} title="Blockchain & Crypto Risk" highlight>
              On-chain transactions are irreversible. Crewboard does not guarantee uptime of the Solana network or any third-party wallet infrastructure. You are solely responsible for any gas fees, network failures, wallet errors, or losses resulting from on-chain activity. Cryptocurrency values are volatile — Crewboard makes no representations about the value of any digital assets. You should not use funds you cannot afford to lose.
            </Section>

            <Section id="s7" num={7} title="Wallet Ownership">
              By connecting a wallet to Crewboard, you confirm that you are the sole owner and controller of that wallet and its private keys. Crewboard does not have access to your private keys and cannot initiate transactions on your behalf. You are solely responsible for the security of your wallet.
            </Section>

            <Section id="s8" num={8} title="Order Completion & Delivery">
              A seller is expected to deliver work that matches the agreed scope within the specified timeframe. Delivery is defined as submitting work through Crewboard&apos;s delivery mechanism. Buyers are expected to review delivered work promptly and either approve payment or raise a dispute within a reasonable period. Approving delivery releases escrow to the seller and is considered final acceptance of the work.
            </Section>

            <Section id="s9" num={9} title="Disputes">
              If a buyer and seller cannot resolve a disagreement, either party may open a formal dispute through Crewboard&apos;s dispute system. Crewboard&apos;s support team will review the evidence submitted by both parties and issue a binding resolution, which may include releasing escrow to either party or splitting funds. Both parties agree to accept Crewboard&apos;s dispute resolution as final. Abuse of the dispute system may result in account suspension.
            </Section>

            <Section id="s10" num={10} title="Non-Circumvention">
              You agree not to circumvent Crewboard&apos;s platform fee by arranging payment for services introduced through Crewboard outside of the platform. If you are introduced to another user through Crewboard, any resulting work arrangement must be transacted through Crewboard for a period of 12 months from the date of introduction. Violation of this clause may result in account termination and a claim for damages equal to the platform fee that would have been payable.
            </Section>

            <Section id="s11" num={11} title="User Content">
              You retain ownership of content you submit (bio, skills, project descriptions, portfolio media, gig listings, messages). By submitting content, you grant Crewboard a non-exclusive, worldwide, royalty-free licence to display it on the platform. You must not post content that is false, defamatory, infringing, or illegal.
            </Section>

            <Section id="s12" num={12} title="Prohibited Services">
              You may not use Crewboard to offer or purchase: illegal goods or services; services that infringe intellectual property rights; fraudulent or deceptive services; services related to gambling, adult content, weapons, or controlled substances; or any services that violate applicable law. Crewboard reserves the right to remove any listing and suspend any account in violation of this section.
            </Section>

            <Section id="s13" num={13} title="Acceptable Use">
              You agree not to: scrape or automate access to the platform without permission; attempt to circumvent security measures; spam, harass, or deceive other users; create fake accounts or reviews; use the platform for money laundering or sanctions evasion; or use the platform for any unlawful purpose.
            </Section>

            <Section id="s14" num={14} title="Taxes">
              You are solely responsible for determining and fulfilling your own tax obligations arising from transactions on Crewboard, including income tax, VAT, GST, or any other applicable taxes. Crewboard does not provide tax advice and does not withhold or remit taxes on your behalf.
            </Section>

            <Section id="s15" num={15} title="Account Suspension & Termination">
              Crewboard may suspend or terminate your account at any time for violation of these terms, fraudulent activity, abuse of the dispute system, or conduct harmful to other users or the platform. In the event of termination, any funds locked in active escrow orders will be handled through the dispute resolution process. You may close your account at any time by contacting us.
            </Section>

            <Section id="s16" num={16} title="Intellectual Property">
              The Crewboard name, logo, and design are the property of Crewboard and may not be used without written permission. All other trademarks belong to their respective owners.
            </Section>

            <Section id="s17" num={17} title="Disclaimer of Warranties">
              Crewboard is provided &quot;as is&quot; without warranty of any kind. We do not guarantee uptime, accuracy of user profiles, quality of work delivered, or successful completion of any transaction or smart contract interaction.
            </Section>

            <Section id="s18" num={18} title="Limitation of Liability">
              To the maximum extent permitted by law, Crewboard shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including losses from on-chain transactions, smart contract failures, or disputes between users. Our total liability to you for any claim shall not exceed the platform fees paid by you in the 3 months preceding the claim.
            </Section>

            <Section id="s19" num={19} title="Governing Law">
              These terms are governed by the laws of England and Wales. Any disputes arising from these terms that cannot be resolved informally shall be submitted to binding arbitration. Nothing in this clause prevents either party from seeking urgent injunctive relief from a court of competent jurisdiction.
            </Section>

            <Section id="s20" num={20} title="Contact">
              For questions about these Terms, reach us on X at{" "}
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

function Section({ id, num, title, highlight, children }: { id: string; num: number; title: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div id={id} style={{ scrollMarginTop: "6rem", borderRadius: 12, ...(highlight ? { border: "1px solid rgba(20,184,166,0.2)", background: "rgba(20,184,166,0.04)", padding: "1.25rem 1.5rem" } : {}) }}>
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
