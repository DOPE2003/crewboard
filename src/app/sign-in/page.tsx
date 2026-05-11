"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

/* ─── Micro icons ────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

/* ─── Shared style tokens ────────────────────────────────────── */
const field: React.CSSProperties = {
  width: "100%", height: 48,
  padding: "0 14px 0 40px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 10, background: "#f8fafc",
  color: "#0f172a", fontFamily: "'Inter', sans-serif",
  fontSize: 14, outline: "none",
  transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
  WebkitAppearance: "none", boxSizing: "border-box",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const iconSlot: React.CSSProperties = {
  position: "absolute", left: 13, top: "50%",
  transform: "translateY(-50%)", color: "#94a3b8",
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
  const [remember, setRemember] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setLoading(true);
    const res = await signIn("credentials", { email: form.email, password: form.password, callbackUrl, redirect: false });
    if (res?.error) { setFormError("Invalid email or password."); setLoading(false); }
    else if (res?.url) { window.location.href = res.url; }
  }

  return (
    <>
      {/* Top nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "14px 40px", borderBottom: "1px solid #f1f5f9",
        fontSize: 13, color: "#64748b", flexShrink: 0,
      }}>
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" style={{ color: "#14B8A6", fontWeight: 700, textDecoration: "none", marginLeft: 5, letterSpacing: "-0.01em" }}>
          Sign up
        </Link>
      </div>

      {/* Body — top-aligned with padding */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "44px 40px 40px" }}>

          <h1 style={{ fontSize: 27, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.045em", margin: "0 0 5px", lineHeight: 1.1 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 22px", lineHeight: 1.55, fontWeight: 400 }}>
            Sign in to your Crewboard account
          </p>

          {/* X button */}
          <button
            type="button"
            onClick={() => signIn("twitter", { callbackUrl })}
            style={{
              width: "100%", height: 48,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              background: "#0f172a", color: "#fff", border: "none",
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: "pointer", marginBottom: 16,
              fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em",
              boxShadow: "0 2px 8px rgba(0,0,0,0.16)",
              transition: "background 0.15s",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with X
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Email */}
            <div style={{ position: "relative" }}>
              <span style={iconSlot}><MailIcon /></span>
              <input
                type="email" placeholder="Email address"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required style={field}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <span style={iconSlot}><LockIcon /></span>
              <input
                type={showPw ? "text" : "password"} placeholder="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required style={{ ...field, paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                display: "flex", alignItems: "center", padding: 4,
              }}>
                {showPw ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>

            {/* Remember me + Forgot */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 1 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "#475569", userSelect: "none" }}>
                <input
                  type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: "#14B8A6", cursor: "pointer" }}
                />
                Remember me
              </label>
              <Link href="/forgot-password" style={{ fontSize: 13, color: "#14B8A6", textDecoration: "none", fontWeight: 500, letterSpacing: "-0.01em" }}>
                Forgot password?
              </Link>
            </div>

            {formError && (
              <div style={{
                padding: "9px 13px", borderRadius: 8,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
                color: "#dc2626", fontSize: 13,
              }}>
                {formError}
              </div>
            )}

            {/* CTA */}
            <button type="submit" disabled={loading} style={{
              width: "100%", height: 48,
              background: "#14B8A6",
              color: "#ffffff", border: "none", borderRadius: 10,
              fontFamily: "'Inter', sans-serif", fontSize: 14.5, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.72 : 1,
              letterSpacing: "-0.02em",
              boxShadow: "0 2px 10px rgba(20,184,166,0.28)",
              transition: "opacity 0.15s",
              marginTop: 4,
            }}>
              {loading ? "Signing in…" : "Sign in to Crewboard"}
            </button>
          </form>

          {/* Trust card */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 11,
            marginTop: 18, padding: "12px 14px",
            borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: "rgba(20,184,166,0.10)", color: "#14B8A6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div style={{ paddingTop: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3, letterSpacing: "-0.01em" }}>
                Your data is safe with us
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>
                We never share your information. You&apos;re in control of your data.
              </div>
            </div>
          </div>

          {/* Terms */}
          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 14, lineHeight: 1.65 }}>
            By signing in, you agree to our{" "}
            <Link href="/terms" style={{ color: "#64748b", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#64748b", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
          </p>

        </div>
      </div>

      <style>{`
        input[type="email"]:focus,
        input[type="password"]:focus,
        input[type="text"]:focus {
          border-color: #14B8A6 !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.10), 0 1px 2px rgba(0,0,0,0.04) !important;
        }
      `}</style>
    </>
  );
}

export default function SignInPage() {
  return (
    <AuthLayout>
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}
