import { NextResponse } from "next/server";
import db from "@/lib/db";

// One-time migration endpoint — creates missing columns/tables via the Neon WebSocket adapter.
// Call: POST /api/admin/migrate  (dev only — remove after running)
export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }

  const results: string[] = [];

  // 1. Add lastSeenAt column to User if missing
  try {
    await db.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3)`;
    results.push("lastSeenAt: ok");
  } catch (e: any) { results.push(`lastSeenAt: ${e.message}`); }

  // 2. Add portfolioItems column to User if missing
  try {
    await db.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "portfolioItems" JSONB NOT NULL DEFAULT '[]'`;
    results.push("portfolioItems: ok");
  } catch (e: any) { results.push(`portfolioItems: ${e.message}`); }

  // 3. Add cvUrl column to User if missing
  try {
    await db.$queryRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cvUrl" TEXT`;
    results.push("cvUrl: ok");
  } catch (e: any) { results.push(`cvUrl: ${e.message}`); }

  // 4. Create Notification table if missing
  try {
    await db.$queryRaw`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id"        TEXT NOT NULL,
        "userId"    TEXT NOT NULL,
        "type"      TEXT NOT NULL DEFAULT 'system',
        "title"     TEXT NOT NULL,
        "body"      TEXT NOT NULL,
        "link"      TEXT,
        "read"      BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;
    results.push("Notification table: ok");
  } catch (e: any) { results.push(`Notification table: ${e.message}`); }

  // 5. Create index on Notification.userId if missing
  try {
    await db.$queryRaw`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")`;
    results.push("Notification index: ok");
  } catch (e: any) { results.push(`Notification index: ${e.message}`); }

  return NextResponse.json({ results });
}
