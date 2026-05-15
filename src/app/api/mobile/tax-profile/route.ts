/**
 * GET  /api/mobile/tax-profile  — return the authenticated user's tax profile
 * POST /api/mobile/tax-profile  — upsert the authenticated user's tax profile
 *
 * GET response:
 *   { data: { legalName, addressLine1, addressLine2, city, postalCode, country, vatId, updatedAt } }
 *   Returns data: null if no profile has been set yet.
 *
 * POST body (all fields required together — no half-profiles):
 *   { legalName, addressLine1, addressLine2?, city, postalCode, country, vatId? }
 *
 * Headers  Authorization: Bearer <token>
 */
import { NextRequest } from "next/server";
import db from "@/lib/db";
import { withMobileAuth, MobileTokenPayload } from "../_lib/auth";
import { ok, err } from "../_lib/response";

// ─── GET ──────────────────────────────────────────────────────────────────────

async function getHandler(_req: NextRequest, user: MobileTokenPayload) {
  const u = await db.user.findUnique({
    where: { id: user.sub },
    select: {
      taxLegalName:      true,
      taxAddressLine1:   true,
      taxAddressLine2:   true,
      taxCity:           true,
      taxPostalCode:     true,
      taxCountry:        true,
      taxVatId:          true,
      taxProfileUpdated: true,
    },
  });

  if (!u) return err("User not found.", 404);

  // If user has never set a profile, return data: null
  if (!u.taxLegalName) return ok(null);

  return ok({
    legalName:    u.taxLegalName,
    addressLine1: u.taxAddressLine1,
    addressLine2: u.taxAddressLine2 ?? null,
    city:         u.taxCity,
    postalCode:   u.taxPostalCode,
    country:      u.taxCountry,
    vatId:        u.taxVatId ?? null,
    updatedAt:    u.taxProfileUpdated?.toISOString() ?? null,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function postHandler(req: NextRequest, user: MobileTokenPayload) {
  const body = await req.json().catch(() => ({}));
  const { legalName, addressLine1, addressLine2, city, postalCode, country, vatId } =
    body as Record<string, string | null | undefined>;

  if (!legalName || legalName.trim().length < 2) {
    return err("legalName is required and must be at least 2 characters.");
  }
  if (!addressLine1?.trim()) return err("addressLine1 is required.");
  if (!city?.trim())         return err("city is required.");
  if (!postalCode?.trim())   return err("postalCode is required.");
  if (!country?.trim() || country.trim().length !== 2) {
    return err("country must be a 2-character ISO 3166-1 alpha-2 code.");
  }

  const now = new Date();

  const updated = await db.user.update({
    where: { id: user.sub },
    data: {
      taxLegalName:      legalName.trim(),
      taxAddressLine1:   addressLine1.trim(),
      taxAddressLine2:   addressLine2?.trim() || null,
      taxCity:           city.trim(),
      taxPostalCode:     postalCode.trim(),
      taxCountry:        country.trim().toUpperCase(),
      taxVatId:          vatId?.trim() || null,
      taxProfileUpdated: now,
    },
    select: {
      taxLegalName:      true,
      taxAddressLine1:   true,
      taxAddressLine2:   true,
      taxCity:           true,
      taxPostalCode:     true,
      taxCountry:        true,
      taxVatId:          true,
      taxProfileUpdated: true,
    },
  });

  return ok({
    legalName:    updated.taxLegalName,
    addressLine1: updated.taxAddressLine1,
    addressLine2: updated.taxAddressLine2 ?? null,
    city:         updated.taxCity,
    postalCode:   updated.taxPostalCode,
    country:      updated.taxCountry,
    vatId:        updated.taxVatId ?? null,
    updatedAt:    updated.taxProfileUpdated?.toISOString() ?? null,
  });
}

export const GET  = withMobileAuth(getHandler);
export const POST = withMobileAuth(postHandler);
