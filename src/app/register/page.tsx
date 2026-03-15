"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
  color: "inherit", fontSize: "0.95rem", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 4, fontSize: "0.72rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8",
};

export default function RegisterPage() {
  const [form, setForm] = useState({ handle: "", email: "", password: "", name: "" });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2MB."); return; }

    // Show local preview immediately
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    setError("");

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) { setError(data.error || "Upload failed."); return; }
    setAvatarUrl(data.url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image: avatarUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
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

            {/* Avatar picker */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)",
                  background: avatarPreview ? "transparent" : "rgba(255,255,255,0.04)",
                  cursor: "pointer", overflow: "hidden", position: "relative", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
                {uploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 18, height: 18, border: "2px solid #2dd4bf", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ fontSize: "0.75rem", color: "#2dd4bf", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                {avatarPreview ? "Change photo" : "Upload photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
            </div>

            <div>
              <label style={labelStyle}>Handle</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "0.95rem" }}>@</span>
                <input
                  type="text"
                  placeholder="yourhandle"
                  value={form.handle}
                  onChange={e => setForm(f => ({ ...f, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  required maxLength={20}
                  style={{ ...inputStyle, paddingLeft: 30 }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Display Name</label>
              <input
                type="text" placeholder="Your name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={50} style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required style={inputStyle}
              />
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>Used for order and message notifications.</div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={8} style={inputStyle}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary auth-btn" disabled={loading || uploading} style={{ marginTop: 4 }}>
              {loading ? "CREATING ACCOUNT..." : "CREATE CREWBOARD ID"}
            </button>
          </form>

          <div style={{ margin: "1.5rem 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <button
            onClick={() => signIn("twitter", { callbackUrl: "/dashboard" })}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            CONTINUE WITH X (uses your X photo)
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
