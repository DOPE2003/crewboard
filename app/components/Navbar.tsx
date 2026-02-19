// app/components/Navbar.tsx
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Crewboard</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <Link href="/talent" className="nav-link">
            Talent
          </Link>
          <Link href="/projects" className="nav-link">
            Projects
          </Link>
          <Link href="/how" className="nav-link">
            How it works
          </Link>
        </nav>

        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link href="/login" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
