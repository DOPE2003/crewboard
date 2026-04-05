"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/actions/admin";
import Modal from "@/components/ui/Modal";

interface Props {
  userId: string;
  role: string;
}

export function AdminUserActions({ userId, role }: Props) {
  const [loading, setLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const router = useRouter();

  async function handleRoleChange() {
    if (!pendingRole) return;
    setLoading(true);
    try {
      // We cast to any here to avoid importing the enum into the client bundle
      await setUserRole(userId, pendingRole as any);
      setPendingRole(null);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  const roleStyles: Record<string, any> = {
    ADMIN: { bg: "rgba(239,68,68,0.05)", color: "#ef4444", border: "rgba(239,68,68,0.2)" },
    MODERATOR: { bg: "rgba(245,158,11,0.05)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    USER: { bg: "rgba(var(--foreground-rgb), 0.05)", color: "var(--text-muted)", border: "var(--card-border)" },
  };

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      <select
        value={role}
        disabled={loading}
        onChange={(e) => setPendingRole(e.target.value)}
        style={{
          padding: "0.4rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid var(--card-border)",
          background: roleStyles[role]?.bg || "var(--card-bg)",
          color: roleStyles[role]?.color || "var(--foreground)",
          fontSize: "0.7rem",
          fontWeight: 700,
          cursor: "pointer",
          outline: "none"
        }}
      >
        <option value="USER">User</option>
        <option value="MODERATOR">Moderator</option>
        <option value="ADMIN">Admin</option>
      </select>

      <Modal
        isOpen={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        title="Confirm Role Change"
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setPendingRole(null)} disabled={loading} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={handleRoleChange} 
              disabled={loading}
              style={{ 
                padding: "0.5rem 1rem", 
                fontSize: "0.75rem", 
                background: "#14b8a6" 
              }}
            >
              {loading ? "..." : "Confirm Change"}
            </button>
          </>
        )}
      >
        Are you sure you want to change this user&apos;s role from <strong>{role}</strong> to <strong>{pendingRole}</strong>? 
        This will immediately update their platform permissions.
      </Modal>
    </div>
  );
}
