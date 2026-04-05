"use client";

import { useState } from "react";
import Link from "next/link";

interface ProfileGig {
  id: string;
  title: string;
  price: number;
}

export interface ProfileData {
  name: string | null;
  twitterHandle: string;
  image: string | null;
  role: string | null; // maps to userTitle
  bio: string | null;
  skills: string[];
  isOG: boolean;
  completedGigs: number;
  avgRating: number | null;
  reviewCount: number;
  avgDelivery: number | null;
  gigs: ProfileGig[];
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="msgs-ps-stars">
      {[1,2,3,4,5].map((i) => (
        <span key={i} style={{ color: i <= full ? "#f59e0b" : "var(--card-border)" }}>★</span>
      ))}
    </span>
  );
}

function ProfileContent({ profile, onClose }: { profile: ProfileData; onClose?: () => void }) {
  return (
    <div className="msgs-ps-inner">
      <div className="msgs-ps-header">
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          overflow: "hidden", flexShrink: 0,
          marginBottom: "0.85rem", position: "relative",
          border: "1px solid var(--card-border)",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {profile.image && (
            <img
              src={profile.image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = "none";
                const fb = t.nextElementSibling as HTMLElement | null;
                if (fb) fb.style.display = "flex";
              }}
            />
          )}
          <div style={{
            width: "100%", height: "100%",
            display: profile.image ? "none" : "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #14B8A6, #0F6E56)",
            color: "white", fontWeight: 700, fontSize: 28,
            position: "absolute", top: 0, left: 0,
          }}>
            {(profile.name ?? profile.twitterHandle ?? "U")[0].toUpperCase()}
          </div>
        </div>
        <div className="msgs-ps-name-row">
          <div className="msgs-ps-name">{profile.name ?? profile.twitterHandle}</div>
          {profile.isOG && <span className="msgs-ps-og-badge">OG</span>}
        </div>
        <div className="msgs-ps-handle">@{profile.twitterHandle}</div>
        {profile.role && <div className="msgs-ps-role">{profile.role}</div>}
      </div>

      {profile.reviewCount > 0 && profile.avgRating !== null && (
        <div className="msgs-ps-rating">
          <StarRating rating={profile.avgRating} />
          <span className="msgs-ps-rating-val">{profile.avgRating.toFixed(1)}</span>
          <span className="msgs-ps-rating-count">· {profile.reviewCount} reviews</span>
        </div>
      )}

      <div className="msgs-ps-stats">
        <div className="msgs-ps-stat">
          <div className="msgs-ps-stat-val">{profile.completedGigs || "0"}</div>
          <div className="msgs-ps-stat-key">GIGS</div>
        </div>
        <div className="msgs-ps-stat">
          <div className="msgs-ps-stat-val">N/A</div>
          <div className="msgs-ps-stat-key">ON TIME</div>
        </div>
        <div className="msgs-ps-stat">
          <div className="msgs-ps-stat-val">{profile.avgDelivery ? `${profile.avgDelivery}d` : "N/A"}</div>
          <div className="msgs-ps-stat-key">AVG. DELIVERY</div>
        </div>
      </div>

      {profile.bio && (
        <div className="msgs-ps-section">
          <div className="msgs-ps-label">ABOUT</div>
          <div className="msgs-ps-bio">{profile.bio}</div>
        </div>
      )}

      {profile.skills.length > 0 && (
        <div className="msgs-ps-section">
          <div className="msgs-ps-label">SKILLS</div>
          <div className="msgs-ps-skills">
            {profile.skills.slice(0, 8).map((s) => (
              <span key={s} className="msgs-ps-skill">{s}</span>
            ))}
          </div>
        </div>
      )}

      {profile.gigs.length > 0 && (
        <div className="msgs-ps-section">
          <div className="msgs-ps-label">ACTIVE GIGS</div>
          <div className="msgs-ps-gigs">
            {profile.gigs.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`} className="msgs-ps-gig-card" onClick={onClose}>
                <div className="msgs-ps-gig-title">{gig.title}</div>
                <div className="msgs-ps-gig-price">${gig.price}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="msgs-ps-actions">
        <Link href={`/u/${profile.twitterHandle}`} className="msgs-ps-btn-outline" onClick={onClose}>
          VIEW FULL PROFILE
        </Link>
        <Link
          href={profile.gigs[0] ? `/gigs/${profile.gigs[0].id}` : `/u/${profile.twitterHandle}`}
          className="msgs-ps-btn-solid"
          onClick={onClose}
        >
          HIRE NOW
        </Link>
      </div>
    </div>
  );
}

export function ProfileSidebarDesktop({ profile }: { profile: ProfileData }) {
  return (
    <div className="msgs-profile-sidebar">
      <ProfileContent profile={profile} />
    </div>
  );
}

export default function ProfileBottomSheet({ profile }: { profile: ProfileData }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="msgs-view-profile-btn" onClick={() => setOpen(true)}>
        Profile
      </button>

      {open && (
        <>
          <div className="msgs-sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="msgs-sheet">
            <div className="msgs-sheet-handle" onClick={() => setOpen(false)} />
            <div className="msgs-sheet-scroll">
              <ProfileContent profile={profile} onClose={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
