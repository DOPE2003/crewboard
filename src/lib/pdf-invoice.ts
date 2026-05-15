/**
 * PDF invoice generator using pdf-lib.
 * Produces a clean A4 PDF invoice in the Crewboard facilitator format.
 */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface InvoiceData {
  invoiceNumber:   string;
  issueDate:       string;   // ISO 8601
  orderId:         string;
  orderTitle:      string;
  txHash:          string | null;

  issuerLegalName: string;
  issuerAddress1:  string;
  issuerAddress2:  string | null;
  issuerCity:      string;
  issuerPostal:    string;
  issuerCountry:   string;
  issuerVatId:     string | null;

  buyerHandle:     string;
  buyerLegalName:  string | null;

  amountUsdc:      number;
  amountEur:       number | null;
  fxRate:          number | null;
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4

  const fontBold   = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg    = await doc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 48;
  const col2   = width / 2;

  const black  = rgb(0.07, 0.07, 0.07);
  const muted  = rgb(0.4, 0.4, 0.4);
  const accent = rgb(0.18, 0.83, 0.75); // #2DD4BF
  const line   = rgb(0.8, 0.8, 0.8);

  let y = height - margin;

  // ── Header ────────────────────────────────────────────────────────────────
  page.drawText("INVOICE", { x: margin, y, font: fontBold, size: 24, color: black });

  const issuedLine = `Issued: ${new Date(data.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
  const orderLine  = `Order: ${data.orderId}`;
  const rightX     = width - margin;

  page.drawText(issuedLine, { x: rightX - fontReg.widthOfTextAtSize(issuedLine, 10), y, font: fontReg, size: 10, color: muted });
  page.drawText(orderLine,  { x: rightX - fontReg.widthOfTextAtSize(orderLine, 10),  y: y - 14, font: fontReg, size: 10, color: muted });

  y -= 18;
  page.drawText(data.invoiceNumber, { x: margin, y, font: fontReg, size: 11, color: muted });

  y -= 18;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: line });
  y -= 20;

  // ── From / To ─────────────────────────────────────────────────────────────
  const colStart = margin;
  const fromY = y;

  page.drawText("FROM", { x: colStart, y, font: fontBold, size: 9, color: muted });
  y -= 15;
  page.drawText(data.issuerLegalName, { x: colStart, y, font: fontBold, size: 11, color: black });
  y -= 14;
  page.drawText(data.issuerAddress1,  { x: colStart, y, font: fontReg, size: 10, color: black });
  y -= 13;
  if (data.issuerAddress2) {
    page.drawText(data.issuerAddress2, { x: colStart, y, font: fontReg, size: 10, color: black });
    y -= 13;
  }
  page.drawText(`${data.issuerPostal} ${data.issuerCity}`, { x: colStart, y, font: fontReg, size: 10, color: black });
  y -= 13;
  page.drawText(countryName(data.issuerCountry), { x: colStart, y, font: fontReg, size: 10, color: black });
  y -= 13;
  const vatText = data.issuerVatId ? `VAT-ID: ${data.issuerVatId}` : "VAT-ID: — (none provided)";
  page.drawText(vatText, { x: colStart, y, font: fontReg, size: 9, color: muted });

  // "To" column (right side)
  let toY = fromY;
  page.drawText("TO", { x: col2, y: toY, font: fontBold, size: 9, color: muted });
  toY -= 15;
  page.drawText(`@${data.buyerHandle}`, { x: col2, y: toY, font: fontBold, size: 11, color: black });
  toY -= 14;
  if (data.buyerLegalName) {
    page.drawText(data.buyerLegalName, { x: col2, y: toY, font: fontReg, size: 10, color: black });
  } else {
    page.drawText("(legal info not provided)", { x: col2, y: toY, font: fontReg, size: 10, color: muted });
  }

  y -= 24;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: line });
  y -= 22;

  // ── Line items table ───────────────────────────────────────────────────────
  page.drawText("DESCRIPTION", { x: margin, y, font: fontBold, size: 9, color: muted });
  page.drawText("AMOUNT",      { x: rightX - 80, y, font: fontBold, size: 9, color: muted });
  y -= 8;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: line });
  y -= 16;

  const description = `${data.orderTitle} (Crewboard order ${data.orderId})`;
  page.drawText(description, { x: margin, y, font: fontReg, size: 10, color: black, maxWidth: col2 - margin - 10 });
  const amountStr = `${data.amountUsdc.toFixed(2)} USDC`;
  page.drawText(amountStr, { x: rightX - fontReg.widthOfTextAtSize(amountStr, 10), y, font: fontReg, size: 10, color: black });
  y -= 24;

  // Total row
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1.5, color: black });
  y -= 16;
  page.drawText("Total", { x: margin, y, font: fontBold, size: 11, color: black });
  const totalStr = `${data.amountUsdc.toFixed(2)} USDC`;
  page.drawText(totalStr, { x: rightX - fontBold.widthOfTextAtSize(totalStr, 11), y, font: fontBold, size: 11, color: black });

  if (data.amountEur !== null && data.fxRate !== null) {
    y -= 14;
    const eurLabel = `EUR equivalent at transaction time (€/USDC: ${data.fxRate.toFixed(4)})`;
    const eurValue = `€${data.amountEur.toFixed(2)}`;
    page.drawText(eurLabel, { x: margin, y, font: fontReg, size: 9, color: muted });
    page.drawText(eurValue, { x: rightX - fontReg.widthOfTextAtSize(eurValue, 9), y, font: fontReg, size: 9, color: muted });
  }

  y -= 28;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: line });
  y -= 20;

  // ── Payment & legal footer ─────────────────────────────────────────────────
  if (data.txHash) {
    const payLine = `Payment: ${data.amountUsdc.toFixed(2)} USDC on Solana mainnet · tx: ${data.txHash.slice(0, 8)}...${data.txHash.slice(-4)} (confirmed)`;
    page.drawText(payLine, { x: margin, y, font: fontReg, size: 9, color: black, maxWidth: width - margin * 2 });
    y -= 14;
  }

  const note1 = "Note: No VAT calculated on this document. Tax classification of crypto payments is the recipient's responsibility — consult a tax advisor.";
  page.drawText(note1, { x: margin, y, font: fontReg, size: 9, color: muted, maxWidth: width - margin * 2 });
  y -= 24;

  const footer = `Issued by ${data.issuerLegalName} via Crewboard.fun — a facilitator platform. Service contract exists directly between issuer and recipient.`;
  page.drawText(footer, { x: margin, y, font: fontBold, size: 9, color: accent, maxWidth: width - margin * 2 });

  return doc.save();
}
