"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ handle: "", email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      // Auto sign-in after registration
      await signIn("credentials", { email: form.email, password: form.password, callbackUrl: "/onboarding" });
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="auth-wrap">
        <div className="auth-card">
          <div className="auth-kicker">— JOIN</div>
          <h1 className="auth-title">Create your Crewboard ID</h1>
          <p className="auth-sub">Your handle becomes your public identity on Crewboard.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "1.5rem" }}>
            <div>
              <label className="form-label" style={{ display: "block", marginBottom: 4, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                Handle
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.95rem" }}>@</span>
                <input
                  type="text"
                  placeholder="yourhandle"
                  value={form.handle}
                  onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  required
                  maxLength={20}
                  style={{ width: "100%", paddingLeft: 30, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "inherit", fontSize: "0.95rem", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: 4, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={50}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "inherit", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: 4, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "inherit", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>Used for order and message notifications.</div>
            </div>

            <div>
              <label className="form-label" style={{ display: "block", marginBottom: 4, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "inherit", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary auth-btn"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE CREWBOARD ID"}
            </button>
          </form>

          <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <button
            className="btn-secondary auth-btn"
            onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            CONTINUE WITH X
          </button>

          <div className="auth-foot" style={{ marginTop: "1.25rem", textAlign: "center" }}>
            <span className="muted">Already have an account? </span>
            <Link href="/login" style={{ color: "#2dd4bf", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
