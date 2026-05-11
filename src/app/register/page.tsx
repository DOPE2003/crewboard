"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    title: "Verified professionals",
    sub: "Quality you can trust",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    iconBg: "#ffedd5",
    iconColor: "#ea580c",
    title: "Secure payments",
    sub: "Escrow protection on every job",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
    title: "Direct communication",
    sub: "Connect and collaborate easily",
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ handle: "", email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Account created — please sign in.");
        setLoading(false);
        window.location.href = "/login";
      } else {
        window.location.href = "/onboarding";
      }
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-split-page">

      {/* ── Left panel ── */}
      <div className="auth-split-left">
        <div className="auth-left-blob-1" />
        <div className="auth-left-blob-2" />

        {/* Logo */}
        <div className="auth-left-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" />
          <div>
            <div className="auth-left-wordmark">crewboard</div>
            <div className="auth-left-wordmark-sub">Web3 Talent Marketplace</div>
          </div>
        </div>

        {/* Badge */}
        <div className="auth-left-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          The future of work is onchain
        </div>

        {/* Heading */}
        <h1 className="auth-left-heading">
          The professional network <span style={{ color: "#14B8A6" }}>Web3</span> deserves.
        </h1>

        {/* Subtext */}
        <p className="auth-left-sub">
          Hire top talent or find meaningful work with secure payments, verified profiles, and a trusted community.
        </p>

        {/* Features */}
        <div className="auth-left-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="auth-left-feature">
              <div className="auth-left-feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>
                {f.icon}
              </div>
              <div>
                <div className="auth-left-feature-title">{f.title}</div>
                <div className="auth-left-feature-sub">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="auth-left-footer">
          © 2026 Crewboard
          <span style={{ color: "#d1d5db" }}>·</span>
          Built on Solana
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-split-right">
        {/* Top nav */}
        <div className="auth-right-topnav">
          Already have an account?
          <Link href="/login">Sign in</Link>
        </div>

        <div className="auth-split-form-wrap">
          {/* Mobile logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" className="auth-split-logo-mobile" />

          <h1 className="auth-split-title">Create your account</h1>
          <p className="auth-split-sub">Your handle is your public identity on Crewboard</p>

          {/* X button */}
          <button onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })} className="auth-btn-x">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Handle with @ prefix + .crewboard.fun suffix */}
            <div className="auth-handle-wrap">
              <span className="auth-handle-at">@</span>
              <input
                type="text"
                placeholder="yourhandle"
                value={form.handle}
                onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                required maxLength={20}
                className="auth-handle-input"
              />
              <span className="auth-handle-suffix">.crewboard.fun</span>
            </div>

            {/* Display name */}
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Display name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={50}
                className="auth-split-input"
              />
            </div>

            {/* Email */}
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="auth-split-input"
              />
            </div>

            {/* Password */}
            <div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required minLength={8}
                  className="auth-split-input"
                  style={{ paddingRight: "3rem" }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-split-eye" tabIndex={-1} aria-label="Toggle password">
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <p className="auth-input-hint">Min. 8 characters</p>
            </div>

            {error && <div className="auth-split-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-btn-primary">
              {loading ? "Creating account…" : "Create Crewboard ID"}
            </button>
          </form>

          {/* Safety card */}
          <div className="auth-safety-card">
            <div className="auth-safety-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="auth-safety-card-title">Your data is safe with us</div>
              <div className="auth-safety-card-sub">We never share your information. You&apos;re in control of your data.</div>
            </div>
          </div>

          <p className="auth-split-terms">
            By joining you agree to our{" "}
            <Link href="/terms" className="auth-split-terms-link">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="auth-split-terms-link">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
