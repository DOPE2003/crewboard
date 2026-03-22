"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/actions/deleteAccount";

export default function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      router.push("/");
    } catch (err) {
      console.error("Delete account failed:", err);
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Trigger link */}
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "none", border: "none", padding: 0,
          fontSize: "12px", color: "#94a3b8",
          cursor: "pointer", marginTop: "8px",
          fontFamily: "inherit", transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
      >
        Delete account
      </button>

      {/* Confirmation modal */}
      {open && (
        <>
          {/* Overlay */}
          <div
            onClick={() => !deleting && setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9100,
              background: "rgba(0,0,0,0.5)",
            }}
          />

          {/* Modal card */}
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9101,
            width: "calc(100% - 48px)",
            maxWidth: "400px",
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 500, margin: 0, color: "#0f172a" }}>
              Delete your account?
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, margin: "12px 0 24px" }}>
              This will permanently delete your profile, gigs, and all your data on Crewboard. This cannot be undone.
            </p>

            {/* Cancel */}
            <button
              onClick={() => setOpen(false)}
              disabled={deleting}
              style={{
                display: "block", width: "100%", padding: "10px",
                borderRadius: "8px", border: "1px solid #e2e8f0",
                background: "#fff", color: "#0f172a",
                fontSize: "14px", fontWeight: 500,
                cursor: deleting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "10px",
                borderRadius: "8px", border: "none",
                background: deleting ? "#fca5a5" : "#ef4444",
                color: "#fff",
                fontSize: "14px", fontWeight: 600,
                cursor: deleting ? "not-allowed" : "pointer",
                marginTop: "8px", fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {deleting && (
                <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />
              )}
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
          </div>
        </>
      )}
    </>
  );
}
