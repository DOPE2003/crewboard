export default function NavLogo() {
  return (
    <>
      <span className="nav-wordmark" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Crewb</span>
      <svg
        width="26" height="26" viewBox="0 0 40 40"
        style={{ margin: "0 1px", display: "block", flexShrink: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="nav-logo-sph-main" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#7ee8d6"/>
            <stop offset="42%" stopColor="#14B8A6"/>
            <stop offset="100%" stopColor="#0b7066"/>
          </radialGradient>
          <radialGradient id="nav-logo-sph-hi" cx="30%" cy="22%" r="48%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.62)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#nav-logo-sph-main)"/>
        <ellipse cx="13.5" cy="12" rx="8" ry="5.5" fill="url(#nav-logo-sph-hi)"/>
        <polygon points="28,20 24,13.1 16,13.1 12,20 16,26.9 24,26.9"
          fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="1.3" strokeLinejoin="round"/>
        <line x1="20" y1="15.5" x2="16.2" y2="22.2" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="20" y1="15.5" x2="23.8" y2="22.2" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="16.2" y1="22.2" x2="23.8" y2="22.2" stroke="rgba(255,255,255,0.88)" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="20" cy="15.5" r="1.5" fill="rgba(255,255,255,0.92)"/>
        <circle cx="16.2" cy="22.2" r="1.5" fill="rgba(255,255,255,0.92)"/>
        <circle cx="23.8" cy="22.2" r="1.5" fill="rgba(255,255,255,0.92)"/>
      </svg>
      <span className="nav-wordmark" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>ard</span>
    </>
  );
}
