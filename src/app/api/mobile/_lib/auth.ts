import { NextRequest } from "next/server";
import { verifyMobileJWT, MobileTokenPayload } from "./jwt";

export type { MobileTokenPayload };

/** Extract and verify the Bearer JWT from the Authorization header. */
export async function getMobileUser(req: NextRequest): Promise<MobileTokenPayload | null> {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  try {
    return await verifyMobileJWT(token);
  } catch {
    return null;
  }
}

export type AuthedHandler = (
  req: NextRequest,
  user: MobileTokenPayload
) => Promise<Response>;

/**
 * Wraps a route handler and enforces JWT auth.
 * Passes the verified token payload as the second argument.
 */
export function withMobileAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getMobileUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, user);
  };
}
