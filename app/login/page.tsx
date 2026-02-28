"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithX() {
    setLoading(true);
    setError(null);

    // redirect: false lets us handle loading state cleanly
    const res = await signIn("twitter", {
      callbackUrl: "/dashboard",
      redirect: true,
    });

    // If redirect happens, code below won't run, but keep for safety
    if ((res as any)?.error) {
      setError("Failed to sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="page">
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
            style={{
              width: "100%",
              maxWidth: 420,
              height: 54,
              borderRadius: 14,
              fontWeight: 700,
              letterSpacing: 1,
            }}
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