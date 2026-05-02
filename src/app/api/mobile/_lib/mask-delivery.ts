/**
 * Hide the pending delivery payload until the status is confirmed "delivered".
 * Prevents buyers seeing orphaned note/files when the on-chain mark_delivered tx failed.
 * delivery_history, revision_requests, revision_count are always safe to expose.
 */
export function maskDelivery<T extends { status: string; deliveryNote?: unknown; deliveryFiles?: unknown; deliverySubmittedAt?: unknown }>(order: T): T {
  if (order.status !== "delivered") {
    return { ...order, deliveryNote: null, deliveryFiles: null, deliverySubmittedAt: null };
  }
  return order;
}
