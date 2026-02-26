"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithX() {
    try {
      setLoading(true);
      setError(null);

      // signIn will redirect by default
      await signIn("twitter", { callbackUrl: "/dashboard" });
    } catch (e: any) {
      setError(e?.message ?? "Failed to sign in.");
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
            type="button"
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

      {/* QUICK UI FIX (in case auth-wrap isn't centering in your CSS) */}
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 20px;
        }

        .auth-wrap {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .auth-card {
          width: 100%;
          max-width: 520px;
          padding: 40px 40px;
        }

        .auth-title {
          margin: 8px 0 10px;
        }

        .auth-sub {
          margin: 0 0 18px;
          max-width: 420px;
        }

        .auth-btn {
          width: 260px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .auth-error {
          margin-top: 16px;
          color: #ff6b6b;
          font-size: 14px;
        }

        .muted {
          opacity: 0.7;
          font-size: 13px;
          display: inline-block;
          margin-top: 14px;
        }
      `}</style>
    </main>
  );
}