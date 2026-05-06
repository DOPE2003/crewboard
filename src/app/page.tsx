import React from "react";
import Link from "next/link";
import { ShieldCheck, Clock, BadgeCheck } from "lucide-react";
import { auth } from "@/auth";
import db from "@/lib/db";
import HeroFloatingProfiles from "@/components/home/HeroFloatingProfiles";
import HomeModeHero from "@/components/home/HomeModeHero";
import HomeModeHIW from "@/components/home/HomeModeHIW";
import "@/styles/landing.css";


export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const rawProfiles = await db.user.findMany({
    where: { profileComplete: true, image: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      twitterHandle: true, name: true, image: true, userTitle: true,
      availability: true, skills: true, bio: true, createdAt: true,
      sellerOrders: { where: { status: "completed" }, select: { amount: true } },
    },
  }).catch(() => []);

  const floatingProfiles = rawProfiles.map((u: any) => ({
    twitterHandle: u.twitterHandle,
    name: u.name,
    image: u.image,
    role: u.userTitle,
    availability: u.availability,
    skills: u.skills,
    bio: u.bio,
    ordersCompleted: (u.sellerOrders as Array<{ amount: number }> ?? []).length,
    totalEarned: (u.sellerOrders as Array<{ amount: number }>).reduce((s: number, o: { amount: number }) => s + o.amount, 0),
    memberSince: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  }));

  const rawFeatured = await db.user.findMany({
    where: { profileComplete: true, image: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 18,
    select: {
      twitterHandle: true, name: true, image: true, userTitle: true, bio: true,
      availability: true, skills: true, lastSeenAt: true, walletAddress: true,
      gigs: {
        where: { status: "active" },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      sellerOrders: { where: { status: "completed" }, select: { id: true } },
      reviewsReceived: { select: { rating: true } },
    },
  }).catch(() => []);

  function profileQuality(u: any): number {
    let s = 0;
    if (u.walletAddress) s += 4;
    if ((u.reviewsReceived?.length ?? 0) > 0) s += 4;
    if ((u.sellerOrders?.length ?? 0) > 0) s += 3;
    if (u.bio && u.bio.length > 10) s += 2;
    if (u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < 7 * 864e5) s += 2;
    if (u.gigs?.length > 0) s += 1;
    if (!u.name) s -= 3;
    return s;
  }

  const featuredFreelancers = [...rawFeatured]
    .sort((a, b) => profileQuality(b) - profileQuality(a))
    .slice(0, 6);


  return (
    <>
    <main className="page landing-page-main">

      {/* ── HERO ── */}
      <div
        className="landing-hero hero-compact-mobile"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "center",
          padding: "clamp(1.2rem, 3vw, 2rem) clamp(1rem, 4vw, 2rem) clamp(2rem, 4vw, 3rem)",
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Glow — desktop only */}
        <div className="hidden md:block" style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(260px, 90vw, 760px)",
          height: "clamp(180px, 32vw, 380px)",
          background: "radial-gradient(ellipse at 50% 50%, rgba(45,212,191,0.28) 0%, rgba(20,184,166,0.12) 50%, transparent 75%)",
          filter: "blur(28px)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Floating profile cards — desktop only */}
        <div className="hidden md:block" style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            {floatingProfiles.length >= 2 && (
              <HeroFloatingProfiles profiles={floatingProfiles} />
            )}
          </div>
        </div>

        {/* Beta badge */}
        <div
          className="hero-beta-badge"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase" as const,
            color: "#0F6E56",
            marginTop: "0.5rem",
            marginBottom: "1.5rem",
            padding: "0.35rem 0.85rem",
            border: "1px solid #14B8A6",
            borderRadius: "999px",
            background: "transparent",
            opacity: 0,
            animation: "fadeUp 0.6s 0.1s forwards",
            position: "relative",
            zIndex: 1,
          }}
        >
          ✦ Now in Beta
        </div>

        {/* Mode-aware hero — headline, subtitle, CTA cards */}
        <HomeModeHero />

        {/* Trust stats */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.82s forwards",
          position: "relative", zIndex: 1, marginBottom: 20,
          display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", justifyContent: "center",
          paddingTop: 4,
        }}>
          {([
            { stat: "2,800+", label: "Vetted creatives" },
            { stat: "$4.2M", label: "Paid via escrow" },
            { stat: "48h", label: "Avg. match time" },
          ] as { stat: string; label: string }[]).map((t, i) => (
            <React.Fragment key={t.label}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em", lineHeight: 1 }}>{t.stat}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)", marginTop: 3 }}>{t.label}</div>
              </div>
              {i < 2 && <div style={{ width: 1, height: 28, background: "var(--border)" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Spotlight card — inside hero ── */}
        <div style={{
          opacity: 0, animation: "fadeUp 0.6s 0.9s forwards",
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 640,
        }}>
          <div className="eco-hero-card" style={{
            display: "flex", borderRadius: 14,
            border: "1px solid rgba(20,184,166,0.2)",
            background: "var(--card-bg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            overflow: "hidden",
          }}>
            {/* Image strip */}
            <div style={{ width: 120, flexShrink: 0, overflow: "hidden", background: "#0B0B2E" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://pbs.twimg.com/media/HGfbHMtbQAAGEv1?format=jpg&name=large"
                alt="Solana Summit Germany"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            {/* Content */}
            <div style={{ padding: "0.8rem 1rem", display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, minWidth: 0, gap: "0.55rem", textAlign: "left" }}>

              {/* Publisher + Powered by Solana */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/superteam-germany.png" alt="Superteam Germany" style={{ width: 17, height: 17, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--foreground)" }}>Superteam Germany</span>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#14b8a6", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 800, flexShrink: 0 }}>✓</span>
                <a href="https://x.com/SuperteamDE" target="_blank" rel="noopener noreferrer" style={{ fontSize: "10px", color: "#14b8a6", textDecoration: "none", fontWeight: 600, marginLeft: "auto", flexShrink: 0 }}>X ↗</a>
              </div>

              {/* Title */}
              <div style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--foreground)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                Content Creators Program — Solana Summit Germany
              </div>

              {/* Benefit + CTA */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: "0.45rem", borderTop: "1px solid var(--card-border)" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#14b8a6", lineHeight: 1.2 }}>Exclusive on-site benefits</div>
                  <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: 2 }}>+ Chance to receive a $500 travel boost · Limited spots</div>
                </div>
                <a
                  href="https://t.co/4EFTnBjaWn"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "0.44rem 0.85rem", borderRadius: 7,
                    background: "var(--foreground)", color: "var(--dropdown-bg)",
                    fontWeight: 700, fontSize: "0.72rem", textDecoration: "none",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}
                >
                  Apply ↗
                </a>
              </div>

              {/* Powered by Solana footer */}
              <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "0.5rem", display: "flex", alignItems: "center" }}>
                <svg width="120" height="33" viewBox="0 0 398 111" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Powered by Solana">
                  <rect width="398" height="111" rx="17" fill="#181728"/>
                  <rect x="1" y="1" width="396" height="109" rx="16" stroke="white" strokeOpacity="0.52" strokeWidth="2"/>
                  <path d="M93.6176 75.2485L81.5667 88.113C81.306 88.3925 80.9904 88.6155 80.6393 88.7681C80.2883 88.9207 79.9095 88.9996 79.5264 89H22.4002C22.1277 88.9998 21.8612 88.9206 21.6333 88.772C21.4054 88.6233 21.2259 88.4117 21.1169 88.1631C21.008 87.9145 20.9742 87.6396 21.0197 87.3722C21.0652 87.1047 21.1881 86.8563 21.3733 86.6573L33.4106 73.7928C33.6712 73.5133 33.9869 73.2904 34.3379 73.1378C34.6889 72.9852 35.0678 72.9062 35.4508 72.9058H92.5771C92.852 72.9002 93.1225 72.9756 93.3545 73.1226C93.5865 73.2697 93.7697 73.4818 93.8809 73.7322C93.9921 73.9826 94.0265 74.2602 93.9796 74.53C93.9328 74.7998 93.8068 75.0498 93.6176 75.2485ZM81.5667 49.3366C81.305 49.0585 80.9891 48.8364 80.6383 48.6839C80.2875 48.5314 79.9092 48.4517 79.5264 48.4497H22.4002C22.1277 48.4498 21.8612 48.5291 21.6333 48.6777C21.4054 48.8264 21.2259 49.0379 21.1169 49.2866C21.008 49.5352 20.9742 49.81 21.0197 50.0775C21.0652 50.3449 21.1881 50.5934 21.3733 50.7924L33.4106 63.6637C33.6722 63.9418 33.9881 64.1639 34.3389 64.3164C34.6897 64.4689 35.068 64.5486 35.4508 64.5506H92.5771C92.8489 64.5492 93.1145 64.469 93.3414 64.3198C93.5683 64.1707 93.7467 63.959 93.8549 63.7107C93.963 63.4623 93.9962 63.188 93.9505 62.9211C93.9047 62.6543 93.782 62.4065 93.5972 62.2079L81.5667 49.3366ZM22.4002 40.0945H79.5264C79.9095 40.0942 80.2883 40.0152 80.6394 39.8626C80.9904 39.71 81.3061 39.487 81.5667 39.2075L93.6176 26.343C93.7588 26.1943 93.8654 26.0164 93.9295 25.822C93.9937 25.6275 94.0139 25.4214 93.9888 25.2183C93.9637 25.0152 93.8938 24.8201 93.7841 24.647C93.6744 24.4739 93.5277 24.327 93.3544 24.217C93.1224 24.07 92.852 23.9946 92.5771 24.0003L35.4508 24.0003C35.0678 24.0007 34.6889 24.0797 34.3379 24.2323C33.9869 24.3849 33.6712 24.6078 33.4106 24.8873L21.3733 37.7518C21.1881 37.9508 21.0652 38.1992 21.0197 38.4667C20.9742 38.7341 21.008 39.009 21.1169 39.2576C21.2259 39.5062 21.4054 39.7178 21.6333 39.8664C21.8612 40.0151 22.1277 40.0943 22.4002 40.0945Z" fill="url(#pbs_grad)"/>
                  <path d="M143.115 68.7869H122.036V61.8937H148.593V55.0005H121.965C121.056 54.9955 120.154 55.1685 119.311 55.5096C118.469 55.8508 117.702 56.3534 117.055 56.9888C116.409 57.6241 115.894 58.3798 115.541 59.2126C115.189 60.0454 115.005 60.9391 115 61.8425V68.8288C115.004 69.733 115.187 70.6277 115.539 71.4616C115.891 72.2954 116.405 73.0522 117.052 73.6886C117.699 74.3249 118.466 74.8283 119.309 75.1701C120.152 75.5118 121.055 75.6851 121.965 75.6801H143.072V82.5732H115.502V89.4664H143.115C144.485 89.474 145.827 89.0779 146.97 88.3281C148.113 87.5782 149.007 86.5085 149.538 85.2541C149.891 84.4214 150.075 83.5279 150.08 82.6245V75.6381C150.076 74.7339 149.893 73.8393 149.541 73.0055C149.189 72.1716 148.675 71.4149 148.028 70.7785C147.381 70.1422 146.614 69.6388 145.771 69.297C144.928 68.9553 144.025 68.7819 143.115 68.7869ZM183.95 55.0005H162.791C161.418 54.9897 160.074 55.3838 158.927 56.133C157.78 56.8822 156.884 57.9527 156.351 59.2086C155.996 60.0425 155.812 60.9375 155.807 61.8425V82.6245C155.812 83.5294 155.996 84.4246 156.351 85.2588C156.884 86.5148 157.78 87.5852 158.927 88.3344C160.074 89.0835 161.418 89.4775 162.791 89.4664H183.95C184.859 89.4714 185.761 89.2985 186.604 88.9573C187.446 88.6162 188.213 88.1136 188.86 87.4782C189.506 86.8428 190.021 86.0872 190.374 85.2544C190.726 84.4215 190.91 83.5279 190.915 82.6245V61.8425C190.91 60.9391 190.726 60.0455 190.373 59.2127C190.021 58.38 189.506 57.6244 188.859 56.9893C188.213 56.3537 187.446 55.851 186.604 55.5097C185.761 55.1685 184.859 54.9954 183.95 55.0005ZM183.898 82.5732H162.843V61.8937H183.889L183.898 82.5732ZM258.059 55.0005L237.421 55.0005C236.511 54.9955 235.609 55.1685 234.767 55.5096C233.924 55.8508 233.158 56.3534 232.511 56.9888C231.864 57.6241 231.35 58.3798 230.997 59.2126C230.644 60.0454 230.46 60.9391 230.455 61.8425V89.4664H237.491V78.1439H258.035V89.4664H265.071V61.8425C265.066 60.9351 264.881 60.0375 264.525 59.2016C264.17 58.3657 263.651 57.6079 262.999 56.9719C262.348 56.3359 261.575 55.8342 260.727 55.4959C259.88 55.1576 258.973 54.9892 258.059 55.0005ZM258.007 71.2507H237.463V61.8937H258.007V71.2507ZM340.212 55.0005H319.574C318.664 54.9955 317.762 55.1685 316.92 55.5096C316.077 55.8508 315.311 56.3534 314.664 56.9888C314.017 57.6241 313.503 58.3798 313.15 59.2126C312.797 60.0454 312.613 60.9391 312.609 61.8425V89.4664H319.644V78.1439H340.142V89.4664H347.177V61.8425C347.173 60.9391 346.989 60.0455 346.636 59.2127C346.283 58.38 345.768 57.6244 345.121 56.9893C343.815 55.7062 342.049 54.9908 340.212 55.0005ZM340.142 71.2507H319.597V61.8937H340.142V71.2507ZM299.335 82.5732H296.52L286.459 57.8882C286.115 57.0365 285.521 56.3065 284.756 55.792C283.99 55.2774 283.087 55.0018 282.163 55.0005H275.92C275.006 54.9956 274.111 55.2601 273.349 55.7605C272.587 56.2609 271.991 56.9746 271.637 57.8114C271.402 58.3667 271.28 58.9626 271.276 59.5649V89.4664H278.312V61.8937H281.126L291.183 86.5787C291.533 87.4289 292.131 88.156 292.899 88.6671C293.668 89.1781 294.573 89.45 295.498 89.4478H301.741C302.348 89.451 302.949 89.3355 303.511 89.1077C304.073 88.8799 304.584 88.5444 305.015 88.1204C305.885 87.2643 306.378 86.1 306.384 84.8834V55.0005H299.335V82.5732ZM204.165 55.0005H197.13V82.6245C197.135 83.5298 197.319 84.4253 197.673 85.2596C198.028 86.0939 198.544 86.8505 199.194 87.486C199.843 88.1216 200.612 88.6237 201.457 88.9635C202.302 89.3034 203.207 89.4743 204.119 89.4664H225.226V82.5732H204.165V55.0005Z" fill="white"/>
                  <path d="M273.293 27.392H276.527L270.697 36.874V42H267.903V36.874L262.095 27.392H265.285L269.289 33.948H269.333L273.293 27.392Z" fill="white" fillOpacity="0.66"/>
                  <path d="M260.63 37.622C260.63 40.24 258.958 42 256.45 42H246.726V27.392H255.9C258.386 27.392 260.058 29.13 260.058 31.77C260.058 32.914 259.574 33.882 258.804 34.52C259.926 35.114 260.63 36.214 260.63 37.622ZM249.52 39.36H256.45C257.264 39.36 257.836 38.788 257.836 37.908V37.468C257.836 36.588 257.264 35.994 256.45 35.994H249.52V39.36ZM249.52 33.376H255.9C256.736 33.376 257.264 32.782 257.264 31.902V31.484C257.264 30.604 256.736 30.01 255.9 30.01H249.52V33.376Z" fill="white" fillOpacity="0.66"/>
                  <path d="M222.191 42V27.392H229.143C233.301 27.392 236.359 30.45 236.359 34.696C236.359 38.898 233.301 42 229.143 42H222.191ZM224.985 39.36H229.143C231.629 39.36 233.433 37.424 233.433 34.696C233.433 31.99 231.629 30.01 229.143 30.01H224.985V39.36Z" fill="white" fillOpacity="0.66"/>
                  <path d="M207.711 30.01V33.376H215.763V35.994H207.711V39.36H218.513V42H204.917V27.392H218.513V30.01H207.711Z" fill="white" fillOpacity="0.66"/>
                  <path d="M190.029 35.994V42H187.235V27.392H197.245C199.731 27.392 201.403 29.13 201.403 31.77C201.403 34.102 199.929 35.752 197.751 35.972L201.403 42H198.257L194.737 35.994H190.029ZM190.029 33.376H197.245C198.081 33.376 198.609 32.782 198.609 31.902V31.484C198.609 30.604 198.081 30.01 197.245 30.01H190.029V33.376Z" fill="white" fillOpacity="0.66"/>
                  <path d="M172.756 30.01V33.376H180.808V35.994H172.756V39.36H183.558V42H169.962V27.392H183.558V30.01H172.756Z" fill="white" fillOpacity="0.66"/>
                  <path d="M163.125 37.16L164.115 27.392H166.843L165.171 42H162.289L158.637 33.244L155.073 42H152.147L150.453 27.392H153.181L154.369 37.182L157.273 30.318H160.045L163.125 37.16Z" fill="white" fillOpacity="0.66"/>
                  <path d="M140.789 42.286C136.631 42.286 133.573 39.074 133.573 34.696C133.573 30.318 136.631 27.084 140.789 27.084C144.947 27.084 148.005 30.318 148.005 34.696C148.005 39.074 144.947 42.286 140.789 42.286ZM136.499 34.696C136.499 37.468 138.303 39.514 140.789 39.514C143.297 39.514 145.123 37.468 145.123 34.696C145.123 31.902 143.297 29.856 140.789 29.856C138.303 29.856 136.499 31.902 136.499 34.696Z" fill="white" fillOpacity="0.66"/>
                  <path d="M127.056 27.392C129.542 27.392 131.214 29.13 131.214 31.77C131.214 34.278 129.542 35.994 127.056 35.994H119.84V42H117.046V27.392H127.056ZM119.84 33.376H127.056C127.892 33.376 128.42 32.782 128.42 31.902V31.484C128.42 30.604 127.892 30.01 127.056 30.01H119.84V33.376Z" fill="white" fillOpacity="0.66"/>
                  <defs>
                    <linearGradient id="pbs_grad" x1="27.1607" y1="90.5505" x2="86.7659" y2="23.0553" gradientUnits="userSpaceOnUse">
                      <stop offset="0.08" stopColor="#9945FF"/>
                      <stop offset="0.3" stopColor="#8752F3"/>
                      <stop offset="0.5" stopColor="#5497D5"/>
                      <stop offset="0.6" stopColor="#43B4CA"/>
                      <stop offset="0.72" stopColor="#28E0B9"/>
                      <stop offset="0.97" stopColor="#19FB9B"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 560px) {
          .eco-hero-card { flex-direction: column !important; }
          .eco-hero-card > div:first-child { width: 100% !important; height: 110px; }
        }
      `}</style>

      {/* ── FEATURED FREELANCERS ── */}
      {featuredFreelancers.length > 0 && (
        <div style={{ background: "var(--background)", padding: "clamp(2.5rem,5vw,3.5rem) 0 clamp(1.5rem,4vw,2.5rem)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 clamp(1rem,4vw,2rem)" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "clamp(1.5rem,3vw,2rem)" }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14B8A6", marginBottom: "0.4rem" }}>
                  Featured talent
                </div>
                <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.3rem,2.8vw,1.75rem)", color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  Top freelancers, ready to hire
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
                  Verified profiles with real reviews and track records
                </p>
              </div>
              <Link href="/talent" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#14b8a6", textDecoration: "none", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                Browse all →
              </Link>
            </div>
            <div style={{ display: "grid", gap: "clamp(0.75rem,2vw,1.25rem)" }} className="ff-grid">
              {featuredFreelancers.map((f: any) => {
                const minPrice = f.gigs?.[0]?.price ?? null;
                const completedCount = f.sellerOrders?.length ?? 0;
                const isAvail = f.availability === "available";
                const isVerified = !!f.walletAddress;
                const reviews: { rating: number }[] = f.reviewsReceived ?? [];
                const avgRating = reviews.length > 0
                  ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
                  : null;
                const activeRecently = f.lastSeenAt
                  ? (Date.now() - new Date(f.lastSeenAt).getTime()) < 7 * 864e5
                  : false;
                return (
                  <Link
                    key={f.twitterHandle}
                    href={`/u/${f.twitterHandle}`}
                    style={{
                      background: "var(--surface)", border: "1px solid var(--card-border)",
                      borderRadius: 14, padding: "14px 14px 12px",
                      textDecoration: "none", color: "inherit",
                      display: "flex", flexDirection: "column", gap: 8,
                      transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
                    }}
                    className="ff-card"
                  >
                    {/* Header: avatar left, name/role right */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.image} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", display: "block" }} />
                        <span style={{
                          position: "absolute", bottom: 1, right: 1, width: 9, height: 9,
                          borderRadius: "50%", border: "2px solid var(--surface)",
                          background: isAvail ? "#22c55e" : f.availability === "open" ? "#f59e0b" : "#94a3b8",
                        }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1, paddingTop: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.name ?? f.twitterHandle}
                          </span>
                          {isVerified && (
                            <span className="cbadge-wrap" style={{ flexShrink: 0 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 15, height: 15, borderRadius: "50%", background: "#14B8A6" }}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                              <span className="cbadge-tip">Verified identity</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {f.userTitle ?? "Freelancer"}
                        </div>
                      </div>
                    </div>

                    {/* Status badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                      {avgRating !== null ? (
                        <>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#92400e", background: "#fef3c7", borderRadius: 99, padding: "2px 7px" }}>
                            ⭐ {avgRating.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                            {completedCount} job{completedCount !== 1 ? "s" : ""}
                          </span>
                          {activeRecently && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#15803d", background: "rgba(34,197,94,0.12)", borderRadius: 99, padding: "2px 7px" }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                              Active
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", background: "var(--background)", border: "1px solid var(--card-border)", borderRadius: 99, padding: "2px 7px" }}>
                            ⭐ New
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#15803d", background: "rgba(34,197,94,0.12)", borderRadius: 99, padding: "2px 7px" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0, display: "inline-block" }} />
                            Available
                          </span>
                        </>
                      )}
                    </div>

                    {/* Skill tags */}
                    {(f.skills as string[] | null)?.length ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(f.skills as string[]).slice(0, 3).map((skill: string) => (
                          <span key={skill} style={{ fontSize: 10, fontWeight: 500, color: "var(--text-muted)", background: "var(--background)", border: "1px solid var(--card-border)", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Price footer */}
                    <div style={{ marginTop: "auto", borderTop: "1px solid var(--card-border)", paddingTop: 9, display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#14B8A6", letterSpacing: "-0.01em" }}>
                        From ${minPrice != null ? minPrice : 50}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>/ project</span>
                    </div>
                  </Link>
                );
              })}
            </div>

          {featuredFreelancers.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No freelancers yet — <Link href="/register" style={{ color: "#14b8a6", textDecoration: "none", fontWeight: 600 }}>be the first to join</Link>.
            </div>
          )}
        </div>
        <style>{`
          .ff-grid { grid-template-columns: repeat(3,1fr); }
          @media (max-width: 900px) { .ff-grid { grid-template-columns: repeat(2,1fr); } }
          @media (max-width: 500px) { .ff-grid { grid-template-columns: 1fr; } }
          .ff-card {
            transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
          }
          .ff-card:hover {
            transform: translateY(-3px) scale(1.012);
            box-shadow: 0 10px 32px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.04);
            border-color: rgba(20,184,166,0.4) !important;
          }
          .cbadge-wrap { position: relative; display: inline-flex; align-items: center; cursor: default; }
          .cbadge-tip {
            display: none; position: absolute; bottom: calc(100% + 6px); left: 50%;
            transform: translateX(-50%);
            background: #0f172a; color: #e2e8f0; font-size: 11px; font-weight: 500;
            padding: 4px 9px; border-radius: 6px; white-space: nowrap;
            pointer-events: none; z-index: 99;
            border: 1px solid rgba(20,184,166,0.25);
          }
          .cbadge-tip::after {
            content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
            border: 4px solid transparent; border-top-color: #0f172a;
          }
          .cbadge-wrap:hover .cbadge-tip { display: block; }
        `}</style>
      </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ padding: "clamp(3rem,6vw,5rem) clamp(1rem,4vw,2rem)", background: "var(--card-bg)", borderTop: "1px solid var(--card-border)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: "clamp(2rem,4vw,3rem)" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#14B8A6", marginBottom: "0.4rem" }}>
              Simple process
            </div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "clamp(1.3rem,2.8vw,1.75rem)", color: "var(--foreground)", margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
              How it works
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: 0, lineHeight: 1.5 }}>Three steps. No hassle.</p>
          </div>

          {/* Mode-aware steps + bottom CTA */}
          <HomeModeHIW isLoggedIn={isLoggedIn} />
        </div>
        <style>{`
          .hiw-grid { grid-template-columns: repeat(3,1fr); }
          @media (max-width: 700px) { .hiw-grid { grid-template-columns: 1fr; } }
          .hiw-card {
            transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
          }
          .hiw-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.07);
            border-color: rgba(20,184,166,0.2) !important;
          }
        `}</style>
      </div>

    </main>
    </>
  );
}
