"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithX() {
    setLoading(true);
    setError(null);

    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div style={{ paddingTop: 90 }} />

      <section className="auth-wrap">
        <div className="auth-card">
          <div className="auth-kicker">— AUTH</div>

          <h1 className="auth-title">Login</h1>

          <p className="auth-sub">
            Continue with X to verify the real account people will work with.
          </p>

          <button
            className="btn-primary auth-btn"
            onClick={signInWithX}
            disabled={loading}
          >
            {loading ? "CONNECTING..." : "CONTINUE WITH X"}
          </button>

          <div className="auth-foot">
            <span className="muted">
              Your X handle becomes part of your public identity on Crewboard.
            </span>
          </div>

          {error && <p className="auth-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}