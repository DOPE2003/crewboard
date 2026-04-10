import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// POST /api/mobile/cleanup-test
// Deletes the mehditest@crewboard.fun test account
// This endpoint only allows deleting the specific test account
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (email !== "mehditest@crewboard.fun") {
      return NextResponse.json({ error: "This endpoint only deletes the test account." }, { status: 403 });
    }

    const user = await db.user.findFirst({
      where: { email: "mehditest@crewboard.fun" },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: true, message: "Account not found, nothing to delete." });
    }

    await db.user.delete({ where: { id: user.id } });
    return NextResponse.json({ ok: true, message: "Test account deleted." });
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete." }, { status: 500 });
  }
}
