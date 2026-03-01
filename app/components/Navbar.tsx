import Link from "next/link";
import { auth } from "@/auth";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav>
      <Link href="/" className="nav-logo">CREWBOARD</Link>

      <ul className="nav-links">
        <li><Link href="/whitepaper">Whitepaper</Link></li>
        <li><Link href="/whitepaper#challenge">Challenge</Link></li>
        <li><Link href="/whitepaper#solution">Solution</Link></li>
        <li><Link href="/whitepaper#roadmap">Roadmap</Link></li>
        <li><Link href="/whitepaper#invest">Invest</Link></li>
      </ul>

      <div>
        {user ? (
          <Link href="/dashboard" className="nav-pill">Dashboard</Link>
        ) : (
          <Link href="/login" className="nav-pill">Login</Link>
        )}
      </div>
    </nav>
  );
}