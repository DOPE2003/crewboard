"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
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
const AtIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
  </svg>
);
const PersonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
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
  transition: "background 0.15s, box-shadow 0.15s",
};

const iconSlot: React.CSSProperties = {
  position: "absolute", left: 16, top: "50%",
  transform: "translateY(-50%)", color: "#b0b8c1",
  display: "flex", alignItems: "center", pointerEvents: "none",
};

const hint: React.CSSProperties = {
  fontSize: 12, color: "#94a3b8", marginTop: 6, paddingLeft: 4,
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "52px 52px 40px" }}>

        {/* Title */}
        <h1 style={{
          fontSize: 30, fontWeight: 800, color: "#0f172a",
          letterSpacing: "-0.045em", margin: "0 0 8px", lineHeight: 1.1,
        }}>
          Create Your Account
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px", lineHeight: 1.5, fontWeight: 400 }}>
          Your handle is your public identity on Crewboard
        </p>

        {/* X button */}
        <button
          type="button"
          onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
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

          {/* Handle */}
          <div>
            <div style={{
              display: "flex", alignItems: "center", height: 52,
              borderRadius: 999, background: "#f4f4f5",
              overflow: "hidden", position: "relative",
            }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#b0b8c1", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                <AtIcon />
              </span>
              <input
                type="text" placeholder="yourhandle"
                value={form.handle}
                onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                required maxLength={20}
                style={{
                  flex: 1, height: "100%", border: "none", background: "transparent",
                  color: "#0f172a", fontFamily: "'Inter', sans-serif", fontSize: 14.5,
                  outline: "none", paddingLeft: 44, paddingRight: 8, minWidth: 0,
                }}
              />
              <span style={{
                paddingRight: 18, color: "#b0b8c1", fontSize: 13,
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
              type="text" placeholder="Display Name"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={50} style={pillField}
            />
          </div>

          {/* Email */}
          <div style={{ position: "relative" }}>
            <span style={iconSlot}><MailIcon /></span>
            <input
              type="email" placeholder="Email Address"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required style={pillField}
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ position: "relative" }}>
              <span style={iconSlot}><LockIcon /></span>
              <input
                type={showPw ? "text" : "password"} placeholder="Password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={8} style={{ ...pillField, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} style={{
                position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#b0b8c1",
                display: "flex", alignItems: "center", padding: 4,
              }}>
                {showPw ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>
            <p style={hint}>Min. 8 characters</p>
          </div>

          {error && (
            <div style={{
              padding: "10px 16px", borderRadius: 999,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
              color: "#dc2626", fontSize: 13,
            }}>
              {error}
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
            {loading ? "Creating account…" : "Create Crewboard ID"}
          </button>
        </form>

        {/* Sign in link */}
        <p style={{ fontSize: 13.5, color: "#94a3b8", textAlign: "center", marginTop: 18 }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "#0f172a", fontWeight: 700, textDecoration: "none" }}>
            Sign in
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
        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="password"]:focus {
          background: #ebebec !important;
          outline: none !important;
        }
      `}</style>
    </AuthLayout>
  );
}
