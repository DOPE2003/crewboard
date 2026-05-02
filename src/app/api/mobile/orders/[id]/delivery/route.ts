/**
 * POST /api/mobile/orders/:id/delivery
 *
 * Seller attaches a delivery payload (note + files) to an order.
 * Does NOT change order status — on-chain mark_delivered + PATCH /status does that.
 * On resubmission the existing payload is pushed to delivery_history first.
 *
 * Auth: Bearer <mobile JWT>, caller must be the order's seller.
 * Allowed states: funded, revision_requested
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { getMobileUser } from "../../../_lib/auth";
import { ok, err } from "../../../_lib/response";
import { maskDelivery } from "../../../_lib/mask-delivery";

interface DeliveryFile {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

const ALLOWED_STATES = ["funded", "revision_requested"];

const ORDER_SELECT = {
  id: true,
  amount: true,
  status: true,
  escrowAddress: true,
  txHash: true,
  createdAt: true,
  updatedAt: true,
  deliveryNote: true,
  deliveryFiles: true,
  deliverySubmittedAt: true,
  deliveryHistory: true,
  revisionRequests: true,
  revisionCount: true,
  gig:     { select: { id: true, title: true, category: true, deliveryDays: true } },
  buyer:   { select: { id: true, name: true, twitterHandle: true, image: true } },
  seller:  { select: { id: true, name: true, twitterHandle: true, image: true } },
  reviews: { select: { id: true, rating: true, body: true, reviewerId: true } },
  offer:   { select: { id: true, title: true, amount: true, deliveryDays: true } },
} as const;

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  try {
    const body = await req.json().catch(() => ({})) as { note?: string; files?: DeliveryFile[] };
    const trimmedNote = body.note?.trim() ?? "";
    const files: DeliveryFile[] = Array.isArray(body.files) ? body.files : [];

    if (!trimmedNote && files.length === 0)
      return err("Delivery requires a note or at least one file.", 400);
    if (trimmedNote.length > 2000)
      return err("Note is too long (max 2000 characters).", 400);
    if (files.length > 10)
      return err("Up to 10 files per delivery.", 400);
    for (const f of files) {
      try {
        const u = new URL(f.url);
        if (!u.hostname.endsWith("crewboard.fun"))
          return err("File URL is not on the Crewboard CDN.", 400);
      } catch {
        return err("File URL is not on the Crewboard CDN.", 400);
      }
    }

    const order = await db.order.findUnique({
      where: { id },
      select: {
        sellerId: true,
        status: true,
        deliveryNote: true,
        deliveryFiles: true,
        deliverySubmittedAt: true,
        deliveryHistory: true,
        revisionCount: true,
      },
    });

    if (!order) return err("Order not found.", 404);
    if (order.sellerId !== user.sub) return err("Only the seller can submit a delivery.", 403);
    if (!ALLOWED_STATES.includes(order.status)) return err("Order is not awaiting delivery.", 400);

    const prevHistory = (order.deliveryHistory as unknown[]) ?? [];
    const hasExisting = order.deliveryNote || (Array.isArray(order.deliveryFiles) && (order.deliveryFiles as unknown[]).length > 0);
    const newHistory = hasExisting
      ? [
          ...prevHistory,
          {
            submittedAt:    order.deliverySubmittedAt,
            note:           order.deliveryNote,
            files:          order.deliveryFiles,
            revisionRound:  order.revisionCount,
          },
        ]
      : prevHistory;

    const updated = await db.order.update({
      where: { id },
      data: {
        deliveryNote:        trimmedNote || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deliveryFiles:       files.length > 0 ? (files as any) : null,
        deliverySubmittedAt: new Date(),
        deliveryHistory:     newHistory as object[],
      },
      select: ORDER_SELECT,
    });

    return ok(maskDelivery(updated));
  } catch (e) {
    console.error("[mobile/orders/:id/delivery]", e);
    return err("Something went wrong.", 500);
  }
}
