"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

/* ─── Icons ───────────────────────────────────────────────────── */
const MailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const XLogo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

/* ─── Shared styles ───────────────────────────────────────────── */
const pillInput: React.CSSProperties = {
  width: "100%", height: 60,
  padding: "0 20px 0 46px",
  border: "none", borderRadius: 30,
  background: "#F5F6FA",
  color: "rgba(0,0,0,0.75)", fontFamily: "'Inter', sans-serif",
  fontSize: 15, fontWeight: 300, outline: "none",
  WebkitAppearance: "none", boxSizing: "border-box",
  transition: "background 0.15s",
};

const iconWrap: React.CSSProperties = {
  position: "absolute", left: 17, top: "50%",
  transform: "translateY(-50%)", color: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", pointerEvents: "none",
};

const blackBtn: React.CSSProperties = {
  width: "100%", height: 60,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
  background: "linear-gradient(360deg, #000000 0%, #232323 100%)",
  boxShadow: "0px 2px 4px rgba(0,0,0,0.25)",
  borderRadius: 30, border: "none",
  color: "#ffffff", fontSize: 16, fontWeight: 600,
  fontFamily: "'Inter', sans-serif",
  cursor: "pointer", letterSpacing: "-0.01em",
  transition: "opacity 0.15s",
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
      {/* Centered column, max 487px */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center",
        padding: "60px max(calc((100% - 487px)/2), 28px)",
      }}>

        {/* Title */}
        <h1 style={{
          fontSize: 36, fontWeight: 700, color: "#000000",
          letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.1,
        }}>
          Welcome Back
        </h1>
        <p style={{
          fontSize: 16, fontWeight: 400, color: "rgba(0,0,0,0.50)",
          margin: "0 0 30px", lineHeight: 1.5,
        }}>
          Sign in to your Crewboard account
        </p>

        {/* Sign in with X */}
        <button
          type="button"
          onClick={() => signIn("twitter", { callbackUrl })}
          style={{ ...blackBtn, marginBottom: 22 }}
        >
          <XLogo />
          Sign in with X
        </button>

        {/* Or divider */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.26)" }} />
          <span style={{ fontSize: 16, fontWeight: 500, color: "rgba(0,0,0,0.50)", padding: "0 16px" }}>Or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.26)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Email */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <span style={iconWrap}><MailIcon /></span>
              <input
                type="email" placeholder="Email Address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required style={pillInput}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ position: "relative" }}>
              <span style={iconWrap}><LockIcon /></span>
              <input
                type={showPw ? "text" : "password"} placeholder="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required style={{ ...pillInput, paddingRight: 50 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", padding: 4,
              }}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <Link href="/forgot-password" style={{ fontSize: 12, fontWeight: 300, color: "rgba(0,0,0,0.50)", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
          </div>

          {formError && (
            <div style={{
              padding: "10px 18px", borderRadius: 30, marginBottom: 10,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#dc2626", fontSize: 14, fontWeight: 400,
            }}>
              {formError}
            </div>
          )}

          {/* CTA */}
          <button type="submit" disabled={loading} style={{ ...blackBtn, opacity: loading ? 0.65 : 1, marginTop: 12 }}>
            {loading ? "Signing in…" : "Sign in to Crewboard"}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ fontSize: 16, textAlign: "center", marginTop: 18, marginBottom: 0 }}>
          <span style={{ color: "rgba(0,0,0,0.50)", fontWeight: 500 }}>Don&apos;t have an account? </span>
          <Link href="/sign-up" style={{ color: "rgba(0,0,0,0.50)", fontWeight: 700, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>

        {/* Trust card */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 16,
          marginTop: 18, padding: "16px 20px",
          borderRadius: 25, background: "#F9F9FB",
          boxShadow: "0px 2px 3px rgba(0,0,0,0.15)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            border: "1.5px solid #d4d4d8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ paddingTop: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#000000", marginBottom: 4 }}>
              Your data is safe with us
            </div>
            <div style={{ fontSize: 13, fontWeight: 400, color: "rgba(0,0,0,0.50)", lineHeight: 1.55 }}>
              We never share your information. You&apos;re in control of your data.
            </div>
          </div>
        </div>

      </div>

      <style>{`
        input[type="email"]:focus,
        input[type="password"]:focus,
        input[type="text"]:focus {
          background: #ECEDF2 !important;
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
