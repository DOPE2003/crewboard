"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

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
const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
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

const field: React.CSSProperties = {
  width: "100%", height: 48,
  padding: "0 14px 0 40px",
  border: "1.5px solid #e2e8f0", borderRadius: 10,
  background: "#f8fafc", color: "#0f172a",
  fontFamily: "'Inter', sans-serif", fontSize: 14,
  outline: "none", WebkitAppearance: "none", boxSizing: "border-box",
  transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const iconSlot: React.CSSProperties = {
  position: "absolute", left: 13, top: "50%",
  transform: "translateY(-50%)", color: "#94a3b8",
  display: "flex", alignItems: "center", pointerEvents: "none",
};

const hint: React.CSSProperties = {
  fontSize: 11.5, color: "#94a3b8", marginTop: 4, paddingLeft: 1,
};

export default function SignUpPage() {
  const [form, setForm] = useState({ handle: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (result?.error) { window.location.href = "/sign-in"; }
      else { window.location.href = "/onboarding"; }
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {/* Top nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "14px 40px", borderBottom: "1px solid #f1f5f9",
        fontSize: 13, color: "#64748b", flexShrink: 0,
      }}>
        Already have an account?{" "}
        <Link href="/sign-in" style={{ color: "#14B8A6", fontWeight: 700, textDecoration: "none", marginLeft: 5, letterSpacing: "-0.01em" }}>
          Sign in
        </Link>
      </div>

      {/* Body — top-aligned with padding */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "36px 40px 40px" }}>

          <h1 style={{ fontSize: 27, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.045em", margin: "0 0 5px", lineHeight: 1.1 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 20px", lineHeight: 1.55, fontWeight: 400 }}>
            Your handle is your public identity on Crewboard
          </p>

          {/* X button */}
          <button
            type="button"
            onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
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
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 13 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 9 }}>

            {/* Handle */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", height: 48,
                border: "1.5px solid #e2e8f0", borderRadius: 10,
                background: "#f8fafc", overflow: "hidden",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
              }}>
                <span style={{ padding: "0 3px 0 13px", color: "#94a3b8", fontSize: 14.5, flexShrink: 0, lineHeight: 1 }}>@</span>
                <input
                  type="text" placeholder="yourhandle"
                  value={form.handle}
                  onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  required maxLength={20}
                  style={{
                    flex: 1, height: "100%", border: "none", background: "transparent",
                    color: "#0f172a", fontFamily: "'Inter', sans-serif", fontSize: 14,
                    outline: "none", padding: "0 4px", minWidth: 0,
                  }}
                />
                <span style={{
                  padding: "0 13px 0 3px", color: "#94a3b8", fontSize: 12.5,
                  fontWeight: 500, flexShrink: 0, whiteSpace: "nowrap",
                }}>
                  .crewboard.fun
                </span>
              </div>
              <p style={hint}>This will be your public profile URL</p>
            </div>

            {/* Display name */}
            <div style={{ position: "relative" }}>
              <span style={iconSlot}><PersonIcon /></span>
              <input
                type="text" placeholder="Display name"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={50} style={field}
              />
            </div>

            {/* Email */}
            <div style={{ position: "relative" }}>
              <span style={iconSlot}><MailIcon /></span>
              <input
                type="email" placeholder="Email address"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required style={field}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ position: "relative" }}>
                <span style={iconSlot}><LockIcon /></span>
                <input
                  type={showPw ? "text" : "password"} placeholder="Password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required minLength={8} style={{ ...field, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                  position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                  display: "flex", alignItems: "center", padding: 4,
                }}>
                  {showPw ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>
              <p style={hint}>Min. 8 characters</p>
            </div>

            {error && (
              <div style={{
                padding: "9px 13px", borderRadius: 8,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
                color: "#dc2626", fontSize: 13,
              }}>
                {error}
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
              {loading ? "Creating account…" : "Create Crewboard ID"}
            </button>
          </form>

          {/* Trust card */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 11,
            marginTop: 16, padding: "12px 14px",
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
          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 13, lineHeight: 1.65 }}>
            By joining you agree to our{" "}
            <Link href="/terms" style={{ color: "#64748b", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#64748b", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</Link>.
          </p>

        </div>
      </div>

      <style>{`
        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="password"]:focus {
          border-color: #14B8A6 !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.10), 0 1px 2px rgba(0,0,0,0.04) !important;
        }
      `}</style>
    </AuthLayout>
  );
}
