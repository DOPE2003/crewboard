/**
 * POST /api/mobile/invoices/generate
 *
 * Generate (or return existing) PDF invoice for a completed order.
 * Idempotent — same orderId always returns the same invoice.
 *
 * Auth:  Bearer <mobile JWT>  (must be the seller/freelancer on the order)
 * Body:  { orderId: string }
 *
 * 200:  { data: { id, orderId, invoiceNumber, pdfUrl, createdAt, amountUsdc, amountEurAtTx, fxRate } }
 * 400:  { error: "order_not_complete" }
 * 403:  { error: "not_seller" }
 * 404:  { error: "order_not_found" }
 * 422:  { error: "tax_profile_incomplete" }
 */
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../../_lib/auth";
import { ok, err } from "../../_lib/response";
import { generateInvoicePdf } from "@/lib/pdf-invoice";

const PAYABLE_STATUSES = ["completed", "released"];

async function fetchEurUsdcRate(): Promise<number | null> {
  try {
    const res  = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=eur",
      { next: { revalidate: 0 } },
    );
    const json = await res.json() as { "usd-coin"?: { eur?: number } };
    return json["usd-coin"]?.eur ?? null;
  } catch {
    return null;
  }
}

async function handler(req: NextRequest, user: MobileTokenPayload) {
  const body = await req.json().catch(() => ({}));
  const { orderId } = body as { orderId?: string };

  if (!orderId) return err("orderId is required.");

  // Load order with all required relations
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id:        true,
      sellerId:  true,
      buyerId:   true,
      status:    true,
      amount:    true,
      txHash:    true,
      invoice:   { select: { id: true, invoiceNumber: true, pdfUrl: true, createdAt: true, amountUsdc: true, amountEurAtTx: true, fxRate: true } },
      gig:       { select: { title: true } },
      offer:     { select: { title: true } },
      buyer:     {
        select: {
          twitterHandle: true,
          taxLegalName:  true,
        },
      },
      seller:    {
        select: {
          taxLegalName:      true,
          taxAddressLine1:   true,
          taxAddressLine2:   true,
          taxCity:           true,
          taxPostalCode:     true,
          taxCountry:        true,
          taxVatId:          true,
        },
      },
    },
  });

  if (!order) return err("order_not_found", 404);
  if (order.sellerId !== user.sub) return err("not_seller", 403);
  if (!PAYABLE_STATUSES.includes(order.status)) return err("order_not_complete", 400);

  // Idempotent — return existing invoice if already generated
  if (order.invoice) {
    const inv = order.invoice;
    return ok({
      id:            inv.id,
      orderId,
      invoiceNumber: inv.invoiceNumber,
      pdfUrl:        inv.pdfUrl,
      createdAt:     inv.createdAt.toISOString(),
      amountUsdc:    inv.amountUsdc,
      amountEurAtTx: inv.amountEurAtTx,
      fxRate:        inv.fxRate,
    });
  }

  // Validate tax profile completeness
  const seller = order.seller;
  if (!seller.taxLegalName || !seller.taxAddressLine1 || !seller.taxCity || !seller.taxPostalCode || !seller.taxCountry) {
    return err("tax_profile_incomplete", 422);
  }

  // Atomically increment invoice counter
  const counter = await db.invoiceCounter.upsert({
    where:  { userId: user.sub },
    create: { userId: user.sub, nextNumber: 2 },
    update: { nextNumber: { increment: 1 } },
    select: { nextNumber: true },
  });
  // The number we just consumed is nextNumber - 1 (or 1 if just created)
  const invoiceSeq   = counter.nextNumber - 1;
  const userPrefix   = user.sub.slice(0, 5).toUpperCase();
  const year         = new Date().getFullYear();
  const invoiceNumber = `CRB-${userPrefix}-${year}-${String(invoiceSeq).padStart(4, "0")}`;

  // Fetch EUR/USDC rate
  const fxRate      = await fetchEurUsdcRate();
  const amountEur   = fxRate !== null ? parseFloat((order.amount * fxRate).toFixed(2)) : null;

  // Snapshot issuer tax profile at generation time
  const issuerSnapshot = {
    legalName:    seller.taxLegalName,
    addressLine1: seller.taxAddressLine1,
    addressLine2: seller.taxAddressLine2 ?? null,
    city:         seller.taxCity,
    postalCode:   seller.taxPostalCode,
    country:      seller.taxCountry,
    vatId:        seller.taxVatId ?? null,
  };

  const orderTitle = order.offer?.title ?? order.gig.title;

  // Generate PDF
  const pdfBytes = await generateInvoicePdf({
    invoiceNumber,
    issueDate:       new Date().toISOString(),
    orderId:         order.id,
    orderTitle,
    txHash:          order.txHash ?? null,
    issuerLegalName: seller.taxLegalName,
    issuerAddress1:  seller.taxAddressLine1,
    issuerAddress2:  seller.taxAddressLine2 ?? null,
    issuerCity:      seller.taxCity,
    issuerPostal:    seller.taxPostalCode,
    issuerCountry:   seller.taxCountry,
    issuerVatId:     seller.taxVatId ?? null,
    buyerHandle:     order.buyer.twitterHandle,
    buyerLegalName:  order.buyer.taxLegalName ?? null,
    amountUsdc:      order.amount,
    amountEur,
    fxRate,
  });

  // Upload PDF to Vercel Blob
  const blob = await put(
    `invoices/${user.sub}/${invoiceNumber}.pdf`,
    Buffer.from(pdfBytes),
    { access: "public", contentType: "application/pdf", addRandomSuffix: false },
  );

  // Persist invoice record
  const invoice = await db.invoice.create({
    data: {
      userId:         user.sub,
      orderId:        order.id,
      invoiceNumber,
      pdfUrl:         blob.url,
      amountUsdc:     order.amount,
      amountEurAtTx:  amountEur,
      fxRate,
      buyerHandle:    order.buyer.twitterHandle,
      buyerLegalName: order.buyer.taxLegalName ?? null,
      issuerSnapshot,
    },
    select: { id: true, createdAt: true },
  });

  return ok({
    id:            invoice.id,
    orderId:       order.id,
    invoiceNumber,
    pdfUrl:        blob.url,
    createdAt:     invoice.createdAt.toISOString(),
    amountUsdc:    order.amount,
    amountEurAtTx: amountEur,
    fxRate,
  });
}

export const POST = withMobileAuth(handler);
