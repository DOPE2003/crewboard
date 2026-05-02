"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

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

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <>
        <h1 className="auth-split-title">Invalid link</h1>
        <p className="auth-split-sub">This reset link is missing or malformed.</p>
        <p className="auth-split-switch" style={{ marginTop: "1.5rem" }}>
          <Link href="/forgot-password" className="auth-split-link">Request a new link</Link>
        </p>
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
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
        <h1 className="auth-split-title">Password updated</h1>
        <p className="auth-split-sub">Your password has been changed. Redirecting you to sign in…</p>
        <p className="auth-split-switch" style={{ marginTop: "1.5rem" }}>
          <Link href="/login" className="auth-split-link">Sign in now</Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="auth-split-title">Choose a new password</h1>
      <p className="auth-split-sub">Must be at least 8 characters.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoFocus
            className="auth-split-input"
            style={{ paddingRight: "3rem" }}
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="auth-split-eye" tabIndex={-1} aria-label="Toggle password">
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          className="auth-split-input"
        />

        {error && <div className="auth-split-error">{error}</div>}

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? "Saving…" : "Set new password"}
        </button>
      </form>

      <p className="auth-split-switch">
        <Link href="/login" className="auth-split-link">Back to sign in</Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
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

          <Suspense>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
