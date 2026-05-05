/**
 * GET  /api/mobile/disputes          — paginated list (both sides)
 * POST /api/mobile/disputes          — file a new dispute
 *
 * Auth: Bearer <mobile JWT>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";
import { DISPUTE_INCLUDE, formatDispute } from "../_lib/dispute-utils";
import { notifyUser } from "@/lib/notify";
import { sendPush } from "@/lib/push";

const VALID_REASONS = new Set([
  "work_not_delivered", "poor_quality", "not_as_described",
  "missed_deadline", "no_payment", "scope_disagreement", "other",
]);

const DISPUTABLE_STATUSES = new Set(["accepted", "funded", "delivered"]);

async function listHandler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit  = Math.min(Number(searchParams.get("limit") ?? 30), 100);

    const disputes = await db.dispute.findMany({
      where: {
        order: { OR: [{ buyerId: user.sub }, { sellerId: user.sub }] },
      },
      orderBy: { createdAt: "desc" },
      take:    limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: DISPUTE_INCLUDE,
    });

    const hasMore    = disputes.length > limit;
    const page       = hasMore ? disputes.slice(0, limit) : disputes;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return ok({ data: page.map(formatDispute), meta: { nextCursor } });
  } catch (e) {
    console.error("[mobile/disputes GET]", e);
    return err("Something went wrong.", 500);
  }
}

async function createHandler(req: NextRequest, user: MobileTokenPayload) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, reason, description, evidence = [] } = body as {
      orderId?:     string;
      reason?:      string;
      description?: string;
      evidence?:    { type: string; url?: string; text?: string }[];
    };

    if (!orderId)                             return err("orderId is required.");
    if (!reason || !VALID_REASONS.has(reason)) return err(`reason must be one of: ${[...VALID_REASONS].join(", ")}.`);
    if (!description?.trim())                 return err("description is required.");

    const [order, existing] = await Promise.all([
      db.order.findUnique({
        where: { id: orderId },
        select: {
          buyerId: true, sellerId: true, status: true,
          buyer:   { select: { name: true, twitterHandle: true } },
          seller:  { select: { name: true, twitterHandle: true } },
          gig:     { select: { title: true } },
        },
      }),
      db.dispute.findFirst({
        where: { orderId, status: { in: ["open", "under_review", "escalated"] } },
        select: { id: true },
      }),
    ]);

    if (!order) return err("Order not found.", 404);

    const isBuyer  = order.buyerId  === user.sub;
    const isSeller = order.sellerId === user.sub;
    if (!isBuyer && !isSeller) return err("You are not a participant in this order.", 403);

    if (!DISPUTABLE_STATUSES.has(order.status)) {
      return err(`Cannot dispute an order in "${order.status}" status.`);
    }

    if (existing) return err("An active dispute already exists for this order.", 409);

    const actorName = isBuyer
      ? (order.buyer.name  ?? order.buyer.twitterHandle)
      : (order.seller.name ?? order.seller.twitterHandle);
    const otherId   = isBuyer ? order.sellerId : order.buyerId;

    const dispute = await db.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          orderId,
          filedById:           user.sub,
          reason,
          description:         description.trim(),
          previousOrderStatus: order.status,
          evidence: {
            create: evidence.map((e) => ({
              type: e.type === "image" ? "image" : "text",
              url:  e.url  ?? null,
              text: e.text ?? null,
            })),
          },
          messages: {
            create: {
              body:     `Dispute opened by ${actorName}: "${reason.replace(/_/g, " ")}"`,
              isSystem: true,
            },
          },
        },
        include: DISPUTE_INCLUDE,
      });

      await tx.order.update({
        where: { id: orderId },
        data:  { status: "disputed" },
      });

      return d;
    });

    notifyUser({
      userId:    otherId,
      type:      "dispute",
      title:     "Dispute Filed",
      body:      `${actorName} filed a dispute for "${order.gig.title}"`,
      link:      `/disputes/${dispute.id}`,
      actionUrl: `crewboard://dispute/${dispute.id}`,
      messageId: `dispute:${dispute.id}`,
    }).catch(() => {});

    sendPush({
      userId: otherId,
      title:  "Dispute Filed",
      body:   `${actorName} opened a dispute for "${order.gig.title}"`,
      data: {
        type:      "dispute_filed",
        actionUrl: `crewboard://dispute/${dispute.id}`,
        disputeId: dispute.id,
        orderId,
        jobTitle:  order.gig.title,
      },
    }).catch(() => {});

    return ok(formatDispute(dispute));
  } catch (e) {
    console.error("[mobile/disputes POST]", e);
    return err("Something went wrong.", 500);
  }
}

export const GET  = withMobileAuth(listHandler);
export const POST = withMobileAuth(createHandler);
