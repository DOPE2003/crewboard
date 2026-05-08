import { createHash, createHmac, randomBytes } from "crypto";

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

const secret = () => process.env.AUTH_SECRET ?? "";

/** Encode a signed, expiring state blob containing the PKCE code_verifier. */
export function makeSignedState(codeVerifier: string): string {
  const payload = { cv: codeVerifier, exp: Date.now() + 10 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Returns `{ cv }` on success, `null` on tampered / expired state. */
export function verifySignedState(state: string): { cv: string } | null {
  const dot = state.lastIndexOf(".");
  if (dot === -1) return null;
  const data = state.slice(0, dot);
  const sig  = state.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.cv || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { cv: payload.cv };
  } catch {
    return null;
  }
}

export function mobileRedirectUri(): string {
  const scheme = process.env.MOBILE_APP_SCHEME ?? "crewboard";
  return `${scheme}://auth/twitter/callback`;
}
