"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

/* ─── Icons ───────────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const XLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

/* ─── Shared styles ───────────────────────────────────────────── */
const pillField: React.CSSProperties = {
  width: "100%", height: 52,
  padding: "0 16px 0 44px",
  border: "none", borderRadius: 999,
  background: "#f4f4f5",
  color: "#0f172a", fontFamily: "'Inter', sans-serif",
  fontSize: 14.5, outline: "none",
  WebkitAppearance: "none", boxSizing: "border-box",
  transition: "background 0.15s",
};

const iconSlot: React.CSSProperties = {
  position: "absolute", left: 16, top: "50%",
  transform: "translateY(-50%)", color: "#b0b8c1",
  display: "flex", alignItems: "center", pointerEvents: "none",
};

/* ─── Form ───────────────────────────────────────────────────── */
function SignInForm() {
  const searchParams = useSearchParams();
  const rawCb = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCb.startsWith("/") ? rawCb : "/dashboard";

  const urlError = searchParams.get("error");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error] = useState(() => {
    if (!urlError) return "";
    const map: Record<string, string> = {
      CredentialsSignin: "Invalid email or password.",
      OAuthAccountNotLinked: "This email is already registered. Sign in with email/password instead.",
      OAuthCallback: "Sign-in with X failed. Please try again.",
      Callback: "Sign-in with X failed. Please try again.",
      OAuthSignin: "Could not connect to X. Please try again.",
      AccessDenied: "Access denied. Please try again.",
      Verification: "The sign-in link expired. Please request a new one.",
    };
    return map[urlError] ?? "Sign-in error. Please try again.";
  });
  const [formError, setFormError] = useState(error);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    const res = await signIn("credentials", { email: form.email, password: form.password, callbackUrl, redirect: false });
    if (res?.error) { setFormError("Invalid email or password."); setLoading(false); }
    else if (res?.url) { window.location.href = res.url; }
  }

  return (
    <AuthLayout step={1}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "52px 52px 40px" }}>

        {/* Title */}
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.045em", margin: "0 0 8px", lineHeight: 1.1,
        }}>
          Welcome Back
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px", lineHeight: 1.5, fontWeight: 400 }}>
          Sign in to your Crewboard account
        </p>

        {/* X button */}
        <button
          type="button"
          onClick={() => signIn("twitter", { callbackUrl })}
          style={{
            width: "100%", height: 52,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            background: "#111111", color: "#fff", border: "none",
            borderRadius: 999, fontSize: 14.5, fontWeight: 600,
            cursor: "pointer", marginBottom: 20,
            fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em",
            transition: "background 0.15s",
          }}
        >
          <XLogo />
          Sign in with X
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
          <span style={{ fontSize: 13, color: "#b0b0b0", fontWeight: 500 }}>Or</span>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Email */}
          <div style={{ position: "relative" }}>
            <span style={iconSlot}><MailIcon /></span>
            <input
              type="email" placeholder="Email Address"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required style={pillField}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ position: "relative" }}>
              <span style={iconSlot}><LockIcon /></span>
              <input
                type={showPw ? "text" : "password"} placeholder="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required style={{ ...pillField, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#b0b8c1",
                display: "flex", alignItems: "center", padding: 4,
              }}>
                {showPw ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>
            {/* Forgot password */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <Link href="/forgot-password" style={{ fontSize: 12.5, color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {formError && (
            <div style={{
              padding: "10px 16px", borderRadius: 999,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
              color: "#dc2626", fontSize: 13,
            }}>
              {formError}
            </div>
          )}

          {/* CTA */}
          <button type="submit" disabled={loading} style={{
            width: "100%", height: 52,
            background: loading ? "#444" : "#111111",
            color: "#ffffff", border: "none", borderRadius: 999,
            fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "-0.02em",
            transition: "background 0.15s",
            marginTop: 4,
          }}>
            {loading ? "Signing in…" : "Sign in to Crewboard"}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ fontSize: 13.5, color: "#94a3b8", textAlign: "center", marginTop: 18 }}>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>

        {/* Trust card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          marginTop: 20, padding: "14px 18px",
          borderRadius: 14, border: "1.5px solid #ececec", background: "#fafafa",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            border: "1.5px solid #d4d4d4",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 2, letterSpacing: "-0.01em" }}>
              Your data is safe with us
            </div>
            <div style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.5 }}>
              We never share your information. You&apos;re in control of your data.
            </div>
          </div>
        </div>

      </div>

      <style>{`
        input[type="email"]:focus,
        input[type="password"]:focus,
        input[type="text"]:focus {
          background: #ebebec !important;
          outline: none !important;
        }
      `}</style>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
