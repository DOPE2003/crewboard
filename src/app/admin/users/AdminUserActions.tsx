"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserRole, toggleOGBadge, deleteUser } from "@/actions/admin";
import Modal from "@/components/ui/Modal";

interface Props {
  userId: string;
  role: string;
  isOG: boolean;
  canManage: boolean;
  isOwner?: boolean;
}

export function AdminUserActions({ userId, role, isOG, canManage, isOwner }: Props) {
  const [loading, setLoading]         = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  async function handleRoleChange() {
    if (!pendingRole) return;
    setLoading(true);
    try {
      await setUserRole(userId, pendingRole as any);
      setPendingRole(null);
      router.refresh();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function handleOG() {
    setLoading(true);
    try { await toggleOGBadge(userId, !isOG); router.refresh(); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  async function handleDelete() {
    setLoading(true);
    try { await deleteUser(userId); setConfirmDelete(false); router.refresh(); }
    catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  const roleColors: Record<string, any> = {
    ADMIN:     { bg: "rgba(239,68,68,0.05)",    color: "#ef4444",         border: "rgba(239,68,68,0.2)" },
    SUPPORT:   { bg: "rgba(99,102,241,0.05)",    color: "#6366f1",         border: "rgba(99,102,241,0.2)" },
    USER:      { bg: "rgba(0,0,0,0.03)",        color: "var(--text-muted)", border: "var(--card-border)" },
  };
  const rc = roleColors[role] ?? roleColors.USER;

  if (!canManage) {
    return (
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>View only</span>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>

        {/* OG badge toggle */}
        <button
          onClick={handleOG}
          disabled={loading}
          title={isOG ? "Revoke OG badge" : "Grant OG badge"}
          style={{
            padding: "0.4rem 0.7rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
            border: "1px solid",
            borderColor: isOG ? "rgba(245,158,11,0.4)" : "var(--card-border)",
            background: isOG ? "rgba(245,158,11,0.08)" : "transparent",
            color: isOG ? "#f59e0b" : "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          {isOG ? "★ OG" : "☆ OG"}
        </button>

        {/* Role select */}
        <select
          value={role}
          disabled={loading}
          onChange={(e) => setPendingRole(e.target.value)}
          style={{
            padding: "0.4rem 0.75rem", borderRadius: 6,
            border: `1px solid ${rc.border}`,
            background: rc.bg, color: rc.color,
            fontSize: "0.7rem", fontWeight: 700,
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="USER">User</option>
          <option value="SUPPORT">Support</option>
          <option value="ADMIN">Admin</option>
          {isOwner && <option value="OWNER">Owner</option>}
        </select>

        {/* Delete */}
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={loading}
          style={{
            padding: "0.4rem 0.7rem", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700,
            border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)",
            color: "#ef4444", cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>

      {/* Role change confirm */}
      <Modal isOpen={pendingRole !== null} onClose={() => setPendingRole(null)} title="Confirm Role Change"
        footer={<>
          <button className="btn-secondary" onClick={() => setPendingRole(null)} disabled={loading} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>Cancel</button>
          <button className="btn-primary" onClick={handleRoleChange} disabled={loading} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", background: "#14b8a6" }}>
            {loading ? "..." : "Confirm"}
          </button>
        </>}
      >
        Change role from <strong>{role}</strong> to <strong>{pendingRole}</strong>?
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete User"
        footer={<>
          <button className="btn-secondary" onClick={() => setConfirmDelete(false)} disabled={loading} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>Cancel</button>
          <button onClick={handleDelete} disabled={loading} style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
            {loading ? "..." : "Delete Forever"}
          </button>
        </>}
      >
        This will permanently delete this user and all their data. This cannot be undone.
      </Modal>
    </>
  );
}
