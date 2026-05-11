"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";

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

const hintStyle: React.CSSProperties = {
  fontSize: 12, color: "#9ca3af", marginTop: 5, paddingLeft: 2,
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
      {/* ── Top nav ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        padding: "16px 44px", borderBottom: "1px solid #f3f4f6", flexShrink: 0,
        fontSize: 13.5, color: "#6b7280",
      }}>
        Already have an account?{" "}
        <Link href="/sign-in" style={{ color: "#14B8A6", fontWeight: 700, textDecoration: "none", marginLeft: 5 }}>
          Sign in
        </Link>
      </div>

      {/* ── Form body ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "28px 44px 40px" }}>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", margin: "0 0 6px" }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 22px", lineHeight: 1.5 }}>
            Your handle is your public identity on Crewboard
          </p>

          {/* Continue with X */}
          <button
            onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, height: 52, background: "#000", color: "#fff", border: "none",
              borderRadius: 13, fontSize: 15, fontWeight: 600, cursor: "pointer",
              marginBottom: 18, fontFamily: "Inter, sans-serif", letterSpacing: "-0.01em",
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Continue with X
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Handle */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", height: 52,
                border: "1.5px solid #e5e7eb", borderRadius: 13,
                background: "#f9fafb", overflow: "hidden",
                transition: "border-color 0.15s, background 0.15s",
              }}>
                <span style={{ padding: "0 4px 0 15px", color: "#9ca3af", fontSize: 15, flexShrink: 0 }}>@</span>
                <input
                  type="text" placeholder="yourhandle"
                  value={form.handle}
                  onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  required maxLength={20}
                  style={{
                    flex: 1, height: "100%", border: "none", background: "transparent",
                    color: "#0a0a0a", fontFamily: "Inter, sans-serif", fontSize: 14.5,
                    outline: "none", padding: "0 4px", minWidth: 0,
                  }}
                />
                <span style={{ padding: "0 15px 0 4px", color: "#6b7280", fontSize: 13.5, fontWeight: 500, flexShrink: 0, whiteSpace: "nowrap" }}>
                  .crewboard.fun
                </span>
              </div>
              <p style={hintStyle}>This will be your public profile URL</p>
            </div>

            {/* Display name */}
            <div style={{ position: "relative" }}>
              <span style={iconWrapStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text" placeholder="Display name"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={50} style={inputStyle}
              />
            </div>

            {/* Email */}
            <div style={{ position: "relative" }}>
              <span style={iconWrapStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input
                type="email" placeholder="Email address"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ position: "relative" }}>
                <span style={iconWrapStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPw ? "text" : "password"} placeholder="Password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required minLength={8} style={{ ...inputStyle, paddingRight: 46 }}
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
              <p style={hintStyle}>Min. 8 characters</p>
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
              {loading ? "Creating account…" : "Create Crewboard ID"}
            </button>
          </form>

          {/* Trust card */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 13,
            marginTop: 18, padding: "14px 16px", borderRadius: 13,
            border: "1.5px solid #e5e7eb", background: "#f9fafb",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: "rgba(20,184,166,0.10)", color: "#14B8A6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
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
          <p style={{ fontSize: 11.5, color: "#9ca3af", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            By joining you agree to our{" "}
            <Link href="/terms" style={{ color: "#6b7280", textDecoration: "underline" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <style>{`
        input:focus { border-color: #14B8A6 !important; background: #ffffff !important; }
        .auth-handle-row:focus-within { border-color: #14B8A6 !important; background: #ffffff !important; }
        button:not([type="submit"]):hover { opacity: 0.9; }
      `}</style>
    </AuthLayout>
  );
}
