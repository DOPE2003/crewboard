"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithX() {
    setLoading(true);
    await signIn("twitter", { callbackUrl: "/dashboard" });
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
          >
            {loading ? "CONNECTING..." : "CONTINUE WITH X"}
          </button>

          <div className="auth-foot">
            <span className="muted">
              Your X handle becomes part of your public identity on Crewboard.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}