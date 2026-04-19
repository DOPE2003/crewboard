/** Successful response — data envelope keeps the iOS client code consistent. */
export function ok<T>(data: T, meta?: Record<string, unknown>): Response {
  return Response.json({ data, ...(meta ? { meta } : {}) });
}

/** Error response. */
export function err(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return Response.json({ error: message, ...(extra ?? {}) }, { status });
}
