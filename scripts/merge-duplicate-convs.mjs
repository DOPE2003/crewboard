/**
 * One-shot script: find duplicate conversations (same 2 participants) and
 * merge them — migrating all messages from orphan → canonical, then deleting
 * the orphan row.
 *
 * Run from repo root:
 *   node scripts/merge-duplicate-convs.mjs
 */
import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_Jo3SgtsyP7GU@ep-noisy-dawn-aiaskkke-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function main() {
  // Find all pairs that have more than one conversation row
  const dupes = await sql`
    SELECT
      LEAST(participants[1], participants[2])     AS user_a,
      GREATEST(participants[1], participants[2])  AS user_b,
      COUNT(*)                                   AS conv_count,
      array_agg(id ORDER BY "updatedAt" DESC)    AS conv_ids
    FROM "Conversation"
    WHERE array_length(participants, 1) = 2
    GROUP BY 1, 2
    HAVING COUNT(*) > 1
  `;

  if (dupes.length === 0) {
    console.log("No duplicate conversations found.");
    return;
  }

  console.log(`Found ${dupes.length} duplicate pair(s):\n`);

  for (const row of dupes) {
    const [canonical, ...orphans] = row.conv_ids;
    console.log(`Pair (${row.user_a} ↔ ${row.user_b})`);
    console.log(`  canonical : ${canonical}`);
    console.log(`  orphans   : ${orphans.join(", ")}`);

    for (const orphan of orphans) {
      // Count messages in orphan
      const [{ count }] = await sql`
        SELECT COUNT(*) AS count FROM "Message" WHERE "conversationId" = ${orphan}
      `;
      console.log(`  Migrating ${count} messages from orphan ${orphan} → ${canonical}`);

      // Re-point messages
      await sql`
        UPDATE "Message"
        SET "conversationId" = ${canonical}
        WHERE "conversationId" = ${orphan}
      `;

      // Update canonical updatedAt to now so it sorts first
      await sql`
        UPDATE "Conversation"
        SET "updatedAt" = NOW()
        WHERE id = ${canonical}
      `;

      // Delete orphan conversation
      await sql`DELETE FROM "Conversation" WHERE id = ${orphan}`;

      console.log(`  Deleted orphan ${orphan}`);
    }

    console.log();
  }

  console.log("Done. All duplicate conversations merged.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
