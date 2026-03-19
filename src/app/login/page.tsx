"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(
    searchParams.get("error") === "CredentialsSignin" ? "Invalid email or password." : ""
  );
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else if (res?.url) {
      window.location.href = res.url;
    }
  }

  return (
    <div className="auth-split-page">

      {/* Full-screen background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/login-bg.jpg" alt="" className="auth-split-bg" />

      {/* Teal/dark gradient overlay */}
      <div className="auth-split-overlay" />

      {/* ── Left — logo + tagline ── */}
      <div className="auth-split-left">
        <div className="auth-split-left-content">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" className="auth-split-logo" />
          <p className="auth-split-tagline">
            The professional network Web3 deserves.
          </p>
        </div>
        <span className="auth-split-copy">© 2026 Crewboard</span>
      </div>

      {/* ── Right — sign in form ── */}
      <div className="auth-split-right">
        <div className="auth-split-form-wrap">

          {/* Mobile: animated logo above form */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" className="auth-split-logo-mobile" />

          <Link href="/" className="auth-split-home-link">
            <span style={{ fontWeight: 300 }}>crew</span><span style={{ fontWeight: 700 }}>board</span>
          </Link>

          <h1 className="auth-split-title">Welcome back</h1>
          <p className="auth-split-sub">Sign in to your Crewboard account</p>

          {/* X/Twitter */}
          <button onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })} className="auth-btn-x">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with X
          </button>

          {/* Divider */}
          <div className="auth-split-divider">
            <div className="auth-split-divider-line" />
            <span className="auth-split-divider-text">or</span>
            <div className="auth-split-divider-line" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="auth-split-input"
            />

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="auth-split-input"
                style={{ paddingRight: "3rem" }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-split-eye" tabIndex={-1} aria-label="Toggle password">
                <EyeIcon open={showPassword} />
              </button>
            </div>

            <div style={{ textAlign: "right", marginTop: -4 }}>
              <Link href="/forgot-password" className="auth-split-forgot">Forgot password?</Link>
            </div>

            {error && <div className="auth-split-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-btn-primary">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-split-switch">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-split-link">Join Crewboard</Link>
          </p>

          <p className="auth-split-terms">
            By signing in you agree to our{" "}
            <Link href="/terms" className="auth-split-terms-link">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="auth-split-terms-link">Privacy Policy</Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
