"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");

    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Magic link sent. Open the newest email and click the link.");
  };

  return (
    <main className="page auth-shell">
      <section className="auth-panel">
        <div className="auth-kicker">Auth </div>

        <h1 className="auth-heading">Login</h1>
        <p className="auth-lead">
          Sign in with email and check your confirmation link
        </p>

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-label">
            <span>Email</span>
            <input
              className="auth-input"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "SENDING..." : "SEND MAGIC LINK"}
          </button>

          {message ? (
            <div className={status === "error" ? "auth-msg error" : "auth-msg"}>
              {message}
            </div>
          ) : null}


        </form>
      </section>
    </main>
  );
}