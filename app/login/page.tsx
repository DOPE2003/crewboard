"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import OrbitImages from "@/app/components/OrbitImages";

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chainLogos = useMemo(
    () => [
      { src: "/logos/solana.png", alt: "Solana" },
      { src: "/logos/sui.png", alt: "Sui" },
      { src: "/logos/tron.png", alt: "TRON" },
      { src: "/logos/xrp.png", alt: "XRP" },
    ],
    []
  );

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    const clean = email.trim().toLowerCase();
    if (!clean) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authWrap">
      <div className="authFrame">
        {/* LEFT: FORM */}
        <div className="authPanel">
          <div className="authBrand">
            <span className="authMark" aria-hidden />
            <div className="authBrandText">
              <div className="authBrandName">Crewboard</div>
              <div className="authBrandTag">Web3 Talent Marketplace</div>
            </div>
          </div>

          <h1 className="authTitle">Sign in</h1>
          <p className="authSub">We’ll send you a secure magic link. No password needed.</p>

          <form onSubmit={sendMagicLink} className="authForm">
            <label className="authLabel" htmlFor="email">
              Email
            </label>

            <div className="authField">
              <span className="authIcon" aria-hidden>
                ✉︎
              </span>
              <input
                id="email"
                className="authInput"
                type="email"
                placeholder="hello@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <button className="authBtn" disabled={loading}>
              {loading ? "Sending…" : "Send magic link"}
            </button>

            <div className="authMeta">
              <span>
                By continuing, you agree to our{" "}
                <Link href="/terms" className="authLink">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="authLink">
                  Privacy Policy
                </Link>
                .
              </span>
            </div>

            {sent && (
              <div className="authNotice ok">
                Magic link sent. Check your inbox (and spam).
              </div>
            )}
            {error && <div className="authNotice err">{error}</div>}

            <div className="authBottom">
              <Link className="authSmallLink" href="/talent">
                Browse talent
              </Link>
              <span className="authDot" />
              <Link className="authSmallLink" href="/projects">
                Explore projects
              </Link>
            </div>
          </form>
        </div>

        {/* RIGHT: ORBIT ART */}
        <div className="authArt" aria-hidden>
          <div className="authArtInner">
            <OrbitImages
              images={chainLogos}
              radiusX={330}
              radiusY={120}
              rotation={-10}
              duration={26}
              itemSize={86}
              showPath={false}
              fill
            />

            {/* soft vignette + depth */}
            <div className="authArtVignette" />
            <div className="authArtGrid" />
          </div>
        </div>
      </div>
    </main>
  );
}
