/**
 * Role-Based Access Control — single source of truth for role hierarchy.
 * Used by both web (auth-utils.ts) and mobile (api/mobile/_lib/auth.ts).
 *
 * Hierarchy (lowest → highest):
 *   USER < SUPPORT < ADMIN < OWNER
 */

export type AppRole = "USER" | "SUPPORT" | "ADMIN" | "OWNER";

const RANK: Record<string, number> = {
  USER:    0,
  SUPPORT: 1,
  ADMIN:   2,
  OWNER:   3,
};

/** Returns true if userRole meets or exceeds the required minimum. */
export function hasMinRole(userRole: string, min: AppRole): boolean {
  return (RANK[userRole?.toUpperCase()] ?? 0) >= (RANK[min] ?? 99);
}

/** Throws if the user does not meet the minimum role. */
export function assertMinRole(userRole: string, min: AppRole): void {
  if (!hasMinRole(userRole, min)) {
    throw new Error(`Requires ${min} role or higher.`);
  }
}

/** True if the user is ADMIN or OWNER. */
export function isAdminOrAbove(role: string): boolean {
  return hasMinRole(role, "ADMIN");
}

/** True if the user is OWNER. */
export function isOwnerRole(role: string): boolean {
  return role?.toUpperCase() === "OWNER";
}
