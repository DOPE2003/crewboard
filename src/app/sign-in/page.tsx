"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

/* ── Shared sub-components ── */

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

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

/* ── Shared field styles ── */
const inputStyle: React.CSSProperties = {
  width: "100%", height: 52, padding: "0 16px 0 44px",
  border: "1.5px solid #e5e7eb", borderRadius: 13,
  background: "#f9fafb", color: "#0a0a0a",
  fontFamily: "Inter, sans-serif", fontSize: 14.5,
  boxSizing: "border-box", outline: "none",
  transition: "border-color 0.15s, background 0.15s",
  WebkitAppearance: "none",
};

const iconWrapStyle: React.CSSProperties = {
  position: "absolute", left: 15, top: "50%",
  transform: "translateY(-50%)", color: "#9ca3af",
  display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 1,
};

/* ── Main form ── */
function SignInForm() {
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
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email, password: form.password, callbackUrl, redirect: false,
    });
    if (res?.error) { setError("Invalid email or password."); setLoading(false); }
    else if (res?.url) { window.location.href = res.url; }
  }

  return (
    <>
      {/* ── Top nav ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "16px 44px", borderBottom: "1px solid #f3f4f6", flexShrink: 0,
        fontSize: 13.5, color: "#6b7280",
      }}>
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" style={{ color: "#14B8A6", fontWeight: 700, textDecoration: "none", marginLeft: 5 }}>
          Sign up
        </Link>
      </div>

      {/* ── Form body ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "32px 44px 40px" }}>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", margin: "0 0 6px" }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
            Sign in to your Crewboard account
          </p>

          {/* Continue with X */}
          <button
            onClick={() => signIn("twitter", { callbackUrl })}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, height: 52, background: "#000", color: "#fff", border: "none",
              borderRadius: 13, fontSize: 15, fontWeight: 600, cursor: "pointer",
              marginBottom: 20, fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with X
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Email */}
            <div style={{ position: "relative" }}>
              <span style={iconWrapStyle}><MailIcon /></span>
              <input
                type="email" placeholder="Email address"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required style={inputStyle}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <span style={iconWrapStyle}><LockIcon /></span>
              <input
                type={showPw ? "text" : "password"} placeholder="Password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required style={{ ...inputStyle, paddingRight: 46 }}
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                style={{
                  position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9ca3af", display: "flex", alignItems: "center", padding: 4,
                }}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>

            {/* Remember me + Forgot password */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13.5, color: "#374151" }}>
                <input
                  type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "#14B8A6", borderRadius: 4, cursor: "pointer" }}
                />
                Remember me
              </label>
              <Link href="/forgot-password" style={{ fontSize: 13.5, color: "#14B8A6", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)",
                color: "#dc2626", fontSize: 13.5,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", height: 52, background: "#14B8A6", color: "#ffffff",
                border: "none", borderRadius: 13, fontFamily: "Inter, sans-serif",
                fontSize: 15.5, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, letterSpacing: "-0.01em",
                transition: "background 0.15s", marginTop: 2,
              }}
            >
              {loading ? "Signing in…" : "Sign in to Crewboard"}
            </button>
          </form>

          {/* Trust card */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 13,
            marginTop: 20, padding: "14px 16px", borderRadius: 13,
            border: "1.5px solid #e5e7eb", background: "#f9fafb",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: "rgba(20,184,166,0.10)", color: "#14B8A6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheckIcon />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0a0a0a", marginBottom: 3, letterSpacing: "-0.01em" }}>
                Your data is safe with us
              </div>
              <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.55 }}>
                We never share your information. You&apos;re in control of your data.
              </div>
            </div>
          </div>

          {/* Terms */}
          <p style={{ fontSize: 11.5, color: "#9ca3af", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            By signing in, you agree to our{" "}
            <Link href="/terms" style={{ color: "#6b7280", textDecoration: "underline" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <style>{`
        input[type="email"]:focus, input[type="password"]:focus, input[type="text"]:focus {
          border-color: #14B8A6 !important;
          background: #ffffff !important;
        }
        button:hover { opacity: 0.92; }
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
