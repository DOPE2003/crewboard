/**
 * PATCH  /api/mobile/admin/users/:id  — change role         (ADMIN+)
 * DELETE /api/mobile/admin/users/:id  — hard-delete user    (OWNER only)
 *
 * PATCH body: { role: "USER" | "SUPPORT" | "ADMIN" | "OWNER" }
 *   ADMIN may only set USER or SUPPORT.
 *   OWNER may set any role.
 *   The OWNER account itself cannot be demoted or deleted.
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import { hasMinRole, isAdminOrAbove } from "@/lib/rbac";
import { logAdminAction } from "@/lib/audit";

const VALID_ROLES = new Set(["USER", "SUPPORT", "ADMIN", "OWNER"]);
type RouteCtx = { params: Promise<{ id: string }> };

// ─── PATCH: change role ───────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const caller = await getMobileUser(req);
    if (!caller) return err("Unauthorized", 401);
    if (!isAdminOrAbove(caller.role)) return err("Forbidden", 403);

    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const newRole = (body?.role as string)?.toUpperCase();

    if (!newRole || !VALID_ROLES.has(newRole)) {
      return err(`role must be one of: ${[...VALID_ROLES].join(", ")}.`);
    }

    // Only OWNER can promote to ADMIN or OWNER
    if (!hasMinRole(caller.role, "OWNER") && (newRole === "ADMIN" || newRole === "OWNER")) {
      return err("Only OWNER can grant ADMIN or OWNER role.", 403);
    }

    // Never touch the owner account
    const ownerId = process.env.OWNER_USER_ID;
    if (ownerId && id === ownerId) return err("Cannot change the owner's role.", 403);
    if (id === caller.sub) return err("You cannot change your own role.");

    const target = await db.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return err("User not found.", 404);
    if (target.role === "OWNER") return err("Cannot change the owner's role.", 403);

    const user = await db.user.update({
      where: { id },
      data: { role: newRole as any },
      select: { id: true, twitterHandle: true, role: true },
    });

    logAdminAction({ actorId: caller.sub, action: "role.change", targetId: id, metadata: { newRole, prevRole: target.role } });

    return ok(user);
  } catch (e: any) {
    if (e?.code === "P2025") return err("User not found.", 404);
    console.error("[mobile/admin/users/[id] PATCH]", e);
    return err("Something went wrong.", 500);
  }
}

// ─── DELETE: hard-delete user ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const caller = await getMobileUser(req);
    if (!caller) return err("Unauthorized", 401);
    if (!hasMinRole(caller.role, "OWNER")) return err("Owner only.", 403);

    const { id } = await ctx.params;

    // Owner can never be deleted
    const ownerId = process.env.OWNER_USER_ID;
    if ((ownerId && id === ownerId) || id === caller.sub) {
      return err("Cannot delete the owner account.", 403);
    }

    const target = await db.user.findUnique({
      where: { id },
      select: { twitterHandle: true, role: true },
    });
    if (!target) return err("User not found.", 404);
    if (target.role === "OWNER") return err("Cannot delete an OWNER account.", 403);

    await db.user.delete({ where: { id } });

    logAdminAction({ actorId: caller.sub, action: "user.delete", targetId: id, metadata: { handle: target.twitterHandle } });

    return ok({ deleted: true, id });
  } catch (e: any) {
    if (e?.code === "P2025") return err("User not found.", 404);
    console.error("[mobile/admin/users/[id] DELETE]", e);
    return err("Something went wrong.", 500);
  }
}
