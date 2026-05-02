import db from "@/lib/db";

export type AdminAction =
  | "role.change"
  | "user.delete"
  | "og.grant"
  | "og.revoke"
  | "order.cancel"
  | "order.freeze"
  | "order.unfreeze"
  | "dispute.resolve"
  | "job.close"
  | "job.reopen"
  | "job.delete"
  | "gig.deactivate"
  | "gig.activate";

/**
 * Fire-and-forget audit log write.
 * Never throws — a logging failure must not break the main action.
 */
export function logAdminAction(params: {
  actorId: string;
  action: AdminAction | string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): void {
  db.adminActionLog
    .create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetId: params.targetId ?? null,
        metadata: params.metadata as any, // ✅ FIX
      },
    })
    .catch((e) => console.error("[audit] log failed:", e));
}