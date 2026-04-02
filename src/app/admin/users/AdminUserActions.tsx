"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleUserAdmin } from "@/actions/admin";
import Modal from "@/components/ui/Modal";

interface Props {
  userId: string;
  isAdmin: boolean;
}

export function AdminUserActions({ userId, isAdmin }: Props) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleToggleAdmin() {
    setLoading(true);
    try {
      await toggleUserAdmin(userId);
      setShowModal(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid var(--card-border)",
          background: isAdmin ? "rgba(239,68,68,0.05)" : "rgba(20,184,166,0.05)",
          color: isAdmin ? "#ef4444" : "#14b8a6",
          fontSize: "0.7rem",
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.2s"
        }}
      >
        {isAdmin ? "Revoke Admin" : "Make Admin"}
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isAdmin ? "Revoke Admin Status?" : "Grant Admin Status?"}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={loading} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={handleToggleAdmin} 
              disabled={loading}
              style={{ 
                padding: "0.5rem 1rem", 
                fontSize: "0.75rem", 
                background: isAdmin ? "#ef4444" : "#14b8a6" 
              }}
            >
              {loading ? "..." : isAdmin ? "Revoke Status" : "Confirm Grant"}
            </button>
          </>
        )}
      >
        {isAdmin 
          ? "This user will lose all administrative privileges, including access to this dashboard and moderation tools."
          : "This user will gain full administrative access to the platform, including user management and gig moderation."
        }
      </Modal>
    </div>
  );
}
