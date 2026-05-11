"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

function LoginForm() {
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/dashboard";

  const urlError = searchParams.get("error");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(() => {
    if (!urlError) return "";
    if (urlError === "CredentialsSignin") return "Invalid email or password.";
    if (urlError === "OAuthAccountNotLinked") return "This email is already registered. Sign in with email/password instead.";
    if (urlError === "OAuthCallback" || urlError === "Callback") return "Sign-in with X failed. Please try again.";
    if (urlError === "OAuthSignin") return "Could not connect to X. Please try again.";
    if (urlError === "AccessDenied") return "Access denied. Please try again.";
    if (urlError === "Verification") return "The sign-in link expired. Please request a new one.";
    return "Sign-in error. Please try again.";
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      callbackUrl,
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

      {/* ── Left panel ── */}
      <div className="auth-split-left">
        <div className="auth-left-blob-1" />
        <div className="auth-left-blob-2" />

        {/* Logo */}
        <div className="auth-left-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" />
          <div>
            <div className="auth-left-wordmark"><span>crew</span>board</div>
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
          <span style={{ color: "#e5e7eb" }}>·</span>
          <svg width="12" height="12" viewBox="0 0 101 88" fill="none" style={{ opacity: 0.5 }}>
            <path d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8894 0.874202 87.6813C0.558829 87.4732 0.31074 87.1764 0.163028 86.8288C0.0153167 86.4812 -0.0305934 86.0977 0.0321229 85.7243C0.0948392 85.3508 0.263695 85.0027 0.518197 84.7209L17.2154 67.3011C17.5778 66.9227 18.0164 66.621 18.5037 66.4148C18.991 66.2086 19.5167 66.1023 20.0479 66.1026H99.0866C99.4637 66.1026 99.8326 66.2132 100.148 66.4213C100.463 66.6294 100.711 66.9262 100.859 67.2738C101.007 67.6214 101.053 68.0049 100.99 68.3783C100.927 68.7518 100.758 69.0999 100.504 69.3817H100.48Z" fill="#9ca3af"/>
          </svg>
          Built on Solana
        </div>

        {/* App mockup */}
        <div className="auth-app-mockup">
          <div className="auth-app-mockup-header">
            <div className="auth-app-mockup-logo-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 19 7 19 17 12 22 5 17 5 7 12 2"/>
              </svg>
            </div>
            <div className="auth-app-mockup-brand">
              crewboard
              <span>Web3 Talent Marketplace</span>
            </div>
          </div>
          <div className="auth-app-mockup-body">
            <div className="auth-app-mockup-card">
              <div className="auth-app-mockup-user">
                <div className="auth-app-mockup-avatar">AE</div>
                <div>
                  <div className="auth-app-mockup-name">Al Eagle</div>
                  <div className="auth-app-mockup-role">Smart Contract Developer</div>
                </div>
              </div>
              <div className="auth-app-mockup-rate">$80 / hr</div>
              <div className="auth-app-mockup-chips">
                {["Solidity", "Rust", "Web3"].map(s => (
                  <span key={s} className="auth-app-mockup-chip">{s}</span>
                ))}
              </div>
              <button className="auth-app-mockup-btn">Hire</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="auth-split-right">
        {/* Top nav */}
        <div className="auth-right-topnav">
          Don&apos;t have an account?
          <Link href="/register">Join Crewboard</Link>
        </div>

        <div className="auth-split-form-wrap">
          {/* Mobile logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-animated.svg" alt="Crewboard" className="auth-split-logo-mobile" />

          <h1 className="auth-split-title">Welcome back</h1>
          <p className="auth-split-sub">Sign in to your Crewboard account</p>

          {/* X button */}
          <button onClick={() => signIn("twitter", { callbackUrl })} className="auth-btn-x">
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
                required
                className="auth-split-input"
                style={{ paddingRight: "3rem" }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-split-eye" tabIndex={-1} aria-label="Toggle password">
                <EyeIcon open={showPassword} />
              </button>
            </div>

            <div style={{ textAlign: "right", marginTop: -2 }}>
              <Link href="/forgot-password" className="auth-split-forgot">Forgot password?</Link>
            </div>

            {error && <div className="auth-split-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-btn-primary">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-split-terms" style={{ marginTop: 24 }}>
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
