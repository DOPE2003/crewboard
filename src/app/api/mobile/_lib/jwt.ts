import { SignJWT, jwtVerify } from "jose";

// Use a dedicated secret for mobile JWTs so they can be rotated independently
// of the web session secret.  Fall back to AUTH_SECRET in dev.
const secret = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET ?? process.env.AUTH_SECRET ?? ""
);

export interface MobileTokenPayload {
  /** Prisma User.id */
  sub: string;
  /** twitterHandle (unique, used as display identifier) */
  handle: string;
  role: string;
}

/** Issue a 90-day JWT for a mobile session. */
export async function signMobileJWT(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ handle: payload.handle, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret);
}

/** Verify and decode a mobile JWT.  Throws on invalid / expired token. */
export async function verifyMobileJWT(token: string): Promise<MobileTokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub) throw new Error("Invalid token: missing sub");
  return {
    sub: payload.sub,
    handle: (payload.handle as string) ?? "",
    role: (payload.role as string) ?? "USER",
  };
}
