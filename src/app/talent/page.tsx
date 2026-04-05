"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  twitterHandle: string | null;
  image: string | null;
  userTitle: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
};

const ROLES = [
  "All",
  "Coding & Tech",
  "AI Engineer",
  "Graphic & Design",
  "Video & Animation",
  "Content Creator",
  "Social Marketing",
  "KOL Manager",
];

export default function TalentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/talent/browse")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = selectedRole === "All"
    ? users
    : users.filter((u) => u.userTitle === selectedRole);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 48px" }}>

        {/* Header */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
          Browse Profiles
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px 0" }}>
          Find the best Web3 talent for your project
        </p>

        {/* Role filter pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                padding: "8px 16px", borderRadius: 99, fontSize: 13, fontWeight: 500,
                border: selectedRole === role ? "none" : "1px solid #e5e7eb",
                background: selectedRole === role ? "#14B8A6" : "white",
                color: selectedRole === role ? "white" : "#6b7280",
                cursor: "pointer",
              }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af", fontSize: 14 }}>
            Loading profiles…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9ca3af", fontSize: 14 }}>
            No profiles found.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}>
            {filtered.map((user) => (
              <ProfileCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
  return (
    <a
      href={`/u/${user.twitterHandle}`}
      style={{
        display: "block",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 20,
        textDecoration: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#14B8A6" }}>
              {(user.name ?? user.twitterHandle ?? "?")[0].toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name ?? user.twitterHandle}
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>@{user.twitterHandle}</p>
        </div>
      </div>

      {/* Role pill */}
      {user.userTitle && (
        <span style={{
          display: "inline-block", fontSize: 11, fontWeight: 600,
          padding: "3px 10px", borderRadius: 99,
          background: "#E1F5EE", color: "#0F6E56", marginBottom: 10,
        }}>
          {user.userTitle}
        </span>
      )}

      {/* Bio */}
      {user.bio && (
        <p style={{
          fontSize: 13, color: "#6b7280", margin: "0 0 12px 0",
          lineHeight: 1.5, overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {user.bio}
        </p>
      )}

      {/* Skills */}
      {user.skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {user.skills.slice(0, 3).map((skill) => (
            <span key={skill} style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 99,
              background: "#f3f4f6", color: "#6b7280", fontWeight: 500,
            }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: user.availability === "available" ? "#22c55e" : "#9ca3af",
            display: "inline-block",
          }} />
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {user.availability === "available" ? "Available" : "Unavailable"}
          </span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, color: "#14B8A6",
          padding: "6px 14px", borderRadius: 8,
          border: "1px solid #14B8A6",
        }}>
          View Profile
        </span>
      </div>
    </a>
  );
}
