"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/login-bg.jpg" alt="" className="auth-split-bg" />
      <div className="auth-split-overlay" />

      <div className="auth-split-left">
        <div className="auth-split-left-content">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" className="auth-split-logo" />
          <p className="auth-split-tagline">The professional network Web3 deserves.</p>
        </div>
        <span className="auth-split-copy">© 2026 Crewboard</span>
      </div>

      <div className="auth-split-right">
        <div className="auth-split-form-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" className="auth-split-logo-mobile" />

          <Link href="/" className="auth-split-home-link">
            <span style={{ fontWeight: 300 }}>crew</span><span style={{ fontWeight: 700 }}>board</span>
          </Link>

          {submitted ? (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(45,212,191,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.25rem",
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 className="auth-split-title">Check your email</h1>
              <p className="auth-split-sub" style={{ maxWidth: 320 }}>
                If <strong>{email}</strong> is registered, you'll receive a reset link within a few minutes.
              </p>
              <p style={{ marginTop: "2rem", fontSize: "0.8125rem", color: "var(--text-muted, #64748b)" }}>
                Didn't get it? Check your spam folder or{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#2dd4bf", fontWeight: 600, padding: 0, fontSize: "inherit", fontFamily: "inherit" }}
                >
                  try again
                </button>.
              </p>
              <p className="auth-split-switch" style={{ marginTop: "1.5rem" }}>
                <Link href="/login" className="auth-split-link">Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-split-title">Forgot your password?</h1>
              <p className="auth-split-sub">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="auth-split-input"
                />

                {error && <div className="auth-split-error">{error}</div>}

                <button type="submit" disabled={loading} className="auth-btn-primary">
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="auth-split-switch">
                <Link href="/login" className="auth-split-link">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
