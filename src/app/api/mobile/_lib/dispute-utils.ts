export const DISPUTE_INCLUDE = {
  evidence: true,
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, name: true, twitterHandle: true, image: true } },
    },
  },
  order: {
    select: {
      txHash: true, amount: true, escrowAddress: true,
      buyerId: true, sellerId: true,
      buyer:  { select: { name: true, twitterHandle: true, image: true } },
      seller: { select: { name: true, twitterHandle: true, image: true } },
      gig:    { select: { title: true } },
    },
  },
} as const;

export function formatDispute(d: any) {
  const o = d.order;
  return {
    id:             d.id,
    transactionId:  o.txHash ?? null,
    jobId:          d.orderId,
    jobTitle:       o.gig.title,
    clientUID:      o.buyerId,
    clientName:     o.buyer.name ?? o.buyer.twitterHandle,
    freelancerUID:  o.sellerId,
    freelancerName: o.seller.name ?? o.seller.twitterHandle,
    filedBy:        d.filedById === o.buyerId ? "client" : "freelancer",
    reason:         d.reason,
    description:    d.description,
    evidence:       d.evidence,
    messages:       d.messages,
    status:         d.status,
    resolution:     d.resolution ?? null,
    createdAt:      d.createdAt,
    updatedAt:      d.updatedAt,
    resolvedAt:     d.resolvedAt ?? null,
    amountLamports: o.amount,
    paymentMethod:  "usdc",
    escrowAddress:  o.escrowAddress ?? null,
  };
}
