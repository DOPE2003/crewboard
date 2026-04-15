import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Whitelist of fields the mobile app is allowed to update.
// Must match Prisma User model field names exactly.
const ALLOWED_FIELDS = [
  "name",
  "userTitle",
  "bio",
  "skills",
  "walletAddress",
  "availability",
  "twitterHandle2",
  "telegramHandle",
  "githubHandle",
  "discordHandle",
  "linkedinHandle",
  "website",
  "website2",
  "website3",
  "email",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

// POST /api/mobile/profile/update
// Body: { id: string, ...fields to update }
// Response: { success: true } or { error: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Map iOS field names to Prisma field names
    if (fields.displayName !== undefined && fields.name === undefined) {
      fields.name = fields.displayName;
    }
    if (fields.contactEmail !== undefined && fields.email === undefined) {
      fields.email = fields.contactEmail;
    }

    // Only pick allowed fields that were actually sent
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (fields[key] !== undefined) {
        // null or empty string clears the column
        updates[key] = fields[key] === null || fields[key] === "" ? null : fields[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.user.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[mobile/profile/update] error:", e);

    // Prisma unique constraint violation (e.g. duplicate walletAddress)
    if (e?.code === "P2002") {
      const field = e.meta?.target?.[0] ?? "field";
      return NextResponse.json(
        { error: `That ${field} is already taken by another user` },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}
