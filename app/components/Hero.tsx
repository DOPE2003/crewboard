// app/components/Hero.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-left">
          <div className="pill">
            <span className="dot" />
            Web3 talent marketplace — fast, verified, global
          </div>

          <h1 className="hero-title">
            Hire builders.
            <br />
            Ship faster.
            <br />
            Stay elite.
          </h1>

          <p className="hero-sub">
            Crewboard connects projects with verified designers, devs, and growth operators.
            One link. One profile. One click to hire.
          </p>

          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              // Later: route to /talent?q=...
              window.location.href = `/talent?q=${encodeURIComponent(query)}`;
            }}
          >
            <div className="search-icon" aria-hidden>
              ⌕
            </div>
            <input
              className="search-input"
              placeholder="Search talent: “Solana dev”, “UI designer”, “Growth”..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <button className="btn btn-primary search-btn" type="submit">
              Search
            </button>
          </form>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">Fast</div>
              <div className="stat-label">Shortlists in minutes</div>
            </div>
            <div className="stat">
              <div className="stat-num">Verified</div>
              <div className="stat-label">Wallet + socials</div>
            </div>
            <div className="stat">
              <div className="stat-num">Global</div>
              <div className="stat-label">Work async</div>
            </div>
          </div>
        </div>

        <div className="hero-right" aria-hidden>
          <div className="glass-card">
            <div className="card-top">
              <div className="avatar" />
              <div className="card-meta">
                <div className="card-name">Amina — Product Designer</div>
                <div className="card-sub">Web3 UX • Systems • Landing pages</div>
              </div>
              <div className="badge">Available</div>
            </div>

            <div className="chips">
              <span className="chip">Figma</span>
              <span className="chip">Design Systems</span>
              <span className="chip">Token UX</span>
              <span className="chip">Brand</span>
            </div>

            <div className="card-cta">
              <Link className="btn btn-ghost" href="/talent">
                View talent
              </Link>
              <Link className="btn btn-primary" href="/login">
                Invite
              </Link>
            </div>
          </div>

          <div className="floating">
            <div className="float-item">
              <div className="mini-dot" />
              Matching: <b>Solana Dev</b> + <b>UI</b> + <b>Growth</b>
            </div>
            <div className="float-item">
              <div className="mini-dot" />
              Avg response: <b>&lt; 2h</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
