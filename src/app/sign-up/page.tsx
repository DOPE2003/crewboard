"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

/* ─── Icons (15×15, opacity 0.50 on inputs) ──────────────────── */
const AtIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
  </svg>
);
const PersonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
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

/* ─── Shared styles (exact Figma values) ─────────────────────── */
const W = 487; // input/button width from Figma

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

const hintText: React.CSSProperties = {
  fontSize: 12, fontWeight: 300, color: "rgba(0,0,0,0.50)",
  marginTop: 6, paddingLeft: 2,
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
    <AuthLayout step={1}>
      {/* Centered column, max 487px — matches Figma input width */}
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
          Create Your Account
        </h1>
        <p style={{
          fontSize: 16, fontWeight: 400, color: "rgba(0,0,0,0.50)",
          margin: "0 0 30px", lineHeight: 1.5,
        }}>
          Your handle is your public identity on Crewboard
        </p>

        {/* Sign in with X */}
        <button
          type="button"
          onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
          style={{ ...blackBtn, marginBottom: 22 }}
        >
          <XLogo />
          Sign in with X
        </button>

        {/* Or divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.26)" }} />
          <span style={{
            fontSize: 16, fontWeight: 500, color: "rgba(0,0,0,0.50)",
            padding: "0 16px",
          }}>Or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.26)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Handle */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ position: "relative" }}>
              <span style={iconWrap}><AtIcon /></span>
              <div style={{
                display: "flex", alignItems: "center", height: 60,
                background: "#F5F6FA", borderRadius: 30,
              }}>
                <input
                  type="text" placeholder="yourhandle"
                  value={form.handle}
                  onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  required maxLength={20}
                  style={{
                    flex: 1, height: "100%", border: "none", background: "transparent",
                    color: "rgba(0,0,0,0.75)", fontFamily: "'Inter', sans-serif",
                    fontSize: 15, fontWeight: 300, outline: "none",
                    paddingLeft: 46, paddingRight: 8, minWidth: 0,
                  }}
                />
                <span style={{
                  paddingRight: 20, fontSize: 15, fontWeight: 300,
                  color: "rgba(0,0,0,0.50)", flexShrink: 0, whiteSpace: "nowrap",
                }}>
                  .crewboard.fun
                </span>
              </div>
            </div>
            <p style={{ ...hintText, marginBottom: 10 }}>This will be your public profile URL</p>
          </div>

          {/* Display Name */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ position: "relative" }}>
              <span style={iconWrap}><PersonIcon /></span>
              <input
                type="text" placeholder="Display Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={50} style={pillInput}
              />
            </div>
          </div>

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
                required minLength={8}
                style={{ ...pillInput, paddingRight: 50 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", padding: 4,
              }}>
                <EyeIcon open={showPw} />
              </button>
            </div>
            <p style={hintText}>Min. 8 characters</p>
          </div>

          {error && (
            <div style={{
              padding: "10px 18px", borderRadius: 30, marginBottom: 10,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#dc2626", fontSize: 14, fontWeight: 400,
            }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <button type="submit" disabled={loading} style={{ ...blackBtn, opacity: loading ? 0.65 : 1, marginTop: 12 }}>
            {loading ? "Creating account…" : "Create Crewboard ID"}
          </button>
        </form>

        {/* Sign in link */}
        <p style={{ fontSize: 16, textAlign: "center", marginTop: 18, marginBottom: 0 }}>
          <span style={{ color: "rgba(0,0,0,0.50)", fontWeight: 500 }}>Already have an account? </span>
          <Link href="/sign-in" style={{ color: "rgba(0,0,0,0.50)", fontWeight: 700, textDecoration: "none" }}>
            Sign in
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
        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="password"]:focus {
          background: #ECEDF2 !important;
        }
      `}</style>
    </AuthLayout>
  );
}
