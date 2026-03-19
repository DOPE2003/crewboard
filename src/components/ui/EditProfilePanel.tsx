"use client";

import { useState } from "react";
import EditProfileForm from "@/components/forms/EditProfileForm";

interface Props {
  initialRole: string;
  initialSkills: string[];
  initialBio: string;
  initialAvailability: string;
}

export default function EditProfilePanel({ initialRole, initialSkills, initialBio, initialAvailability }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Edit Profile button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize: "0.78rem", fontWeight: 600, padding: "7px 16px", borderRadius: 8,
          border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a",
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
        </svg>
        Edit Profile
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Slide-in panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 100vw)",
        background: "#fff",
        borderLeft: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.12)",
        zIndex: 9001,
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
      }}>
        {/* Panel header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.1rem 1.5rem",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.03em", color: "#0f172a" }}>
            Edit Profile
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
          {open && (
            <EditProfileForm
              initialRole={initialRole}
              initialSkills={initialSkills}
              initialBio={initialBio}
              initialAvailability={initialAvailability}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </div>
    </>
  );
}
