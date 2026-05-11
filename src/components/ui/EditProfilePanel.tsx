"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import EditProfileForm from "@/components/forms/EditProfileForm";

interface Props {
  initialRole: string;
  initialSkills: string[];
  initialBio: string;
  initialAvailability: string;
}

export default function EditProfilePanel({ initialRole, initialSkills, initialBio, initialAvailability }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only use portal after hydration
  useEffect(() => { setMounted(true); }, []);

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Slide-in panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 100vw)",
        background: "var(--card-bg, #fff)",
        borderLeft: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "-12px 0 40px rgba(0,0,0,0.15)",
        zIndex: 9001,
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.1rem 1.5rem",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          position: "sticky", top: 0,
          background: "var(--card-bg, #fff)", zIndex: 1,
        }}>
          <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--foreground)" }}>
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
          <EditProfileForm
            initialRole={initialRole}
            initialSkills={initialSkills}
            initialBio={initialBio}
            initialAvailability={initialAvailability}
            onClose={() => setOpen(false)}
          />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize: "0.82rem", fontWeight: 700, padding: "9px 20px", borderRadius: 10,
          border: "none", background: "#14B8A6", color: "#fff",
          display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
          boxShadow: "0 2px 8px rgba(20,184,166,0.3)",
          transition: "background 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0d9488"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#14B8A6"; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
        </svg>
        Edit Profile
      </button>

      {/* Portal: renders into document.body, outside any stacking context */}
      {open && mounted && createPortal(modal, document.body)}
    </>
  );
}
