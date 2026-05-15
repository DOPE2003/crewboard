/**
 * GET /api/config/pusher
 *
 * Public bootstrap config — iOS calls this on first realtime-connection attempt
 * and caches the result. No auth required (key is the publishable Pusher key).
 *
 * Response: { key: string; cluster: string }
 */
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(_req: NextRequest) {
  const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    return Response.json({ error: "Pusher not configured." }, { status: 503 });
  }

  return Response.json({ key, cluster });
}
