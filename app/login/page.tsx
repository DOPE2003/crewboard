"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithX() {
    setLoading(true);
    setError(null);

    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      // ✅ Supabase still uses "twitter" provider key
      provider: "twitter",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main
      className="page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 60px",
      }}
    >
      <section style={{ width: "100%", maxWidth: 560 }}>
        <div
          className="auth-card"
          style={{
            width: "100%",
            borderRadius: 18,
            padding: "42px 34px",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            className="auth-kicker"
            style={{
              fontFamily: "Space Mono, monospace",
              letterSpacing: "0.28em",
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            — AUTH
          </div>

          <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.05 }}>
            Login
          </h1>

          <p style={{ color: "rgba(255,255,255,0.70)", marginTop: 12 }}>
            Continue with X to verify the real account people will work with.
          </p>

          <button
            className="btn-primary"
            onClick={signInWithX}
            disabled={loading}
            style={{
              marginTop: 22,
              width: "100%",
              height: 52,
              borderRadius: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {loading ? "CONNECTING..." : "CONTINUE WITH X"}
          </button>

          <div style={{ marginTop: 16 }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
              Your X handle becomes part of your public identity on Crewboard.
            </span>
          </div>

          {error && (
            <p style={{ marginTop: 18, color: "#ff6b6b", fontSize: 14 }}>
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}