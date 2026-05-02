import { NextRequest } from "next/server";
import { verifyMobileJWT, MobileTokenPayload } from "./jwt";
import { hasMinRole, AppRole } from "@/lib/rbac";

export type { MobileTokenPayload };

/** Extract and verify the Bearer JWT from the Authorization header. */
export async function getMobileUser(req: NextRequest): Promise<MobileTokenPayload | null> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    const payload = await verifyMobileJWT(token);
    // OWNER_USER_ID env override: always elevate this user to OWNER regardless
    // of what role is embedded in the JWT. Guards against accidental DB demotions.
    const ownerId = process.env.OWNER_USER_ID;
    if (ownerId && payload.sub === ownerId) {
      return { ...payload, role: "OWNER" };
    }
    return payload;
  } catch {
    return null;
  }
}

export type AuthedHandler = (
  req: NextRequest,
  user: MobileTokenPayload
) => Promise<Response>;

/** Rejects unauthenticated requests (401). */
export function withMobileAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getMobileUser(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    return handler(req, user);
  };
}

/**
 * Rejects requests where the caller's role is below minRole (403).
 * Role is always validated server-side from the signed JWT — never from the request body.
 */
export function withRole(minRole: AppRole, handler: AuthedHandler) {
  return withMobileAuth(async (req, user) => {
    if (!hasMinRole(user.role, minRole)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, user);
  });
}

/** Requires ADMIN or OWNER. */
export const withAdminAuth  = (h: AuthedHandler) => withRole("ADMIN",   h);

/** Requires OWNER only. */
export const withOwnerAuth  = (h: AuthedHandler) => withRole("OWNER",   h);

/** Requires SUPPORT, ADMIN, or OWNER. */
export const withSupportAuth = (h: AuthedHandler) => withRole("SUPPORT", h);
