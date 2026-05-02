/**
 * One-shot script: upload base64 bannerImage blobs to Vercel Blob storage,
 * then replace the raw base64 in the DB with the proxy URL.
 *
 * Run from repo root:
 *   node scripts/migrate-base64-banners.mjs
 */
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_Jo3SgtsyP7GU@ep-noisy-dawn-aiaskkke-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const BLOB_TOKEN = "vercel_blob_rw_sh35hAqYmC3iN1xD_vmAnS1xvOasYLuYbs6KIhjLPum3fGl";

const sql = neon(DATABASE_URL);

const mimeToExt = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

function parseDataUrl(dataUrl) {
  // data:image/png;base64,<data>
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error("Not a valid data URL");
  return { mime: match[1], b64: match[2] };
}

async function uploadBase64(b64, mime, filename) {
  const buffer = Buffer.from(b64, "base64");
  const blob = await put(filename, buffer, {
    access: "private",
    token: BLOB_TOKEN,
    contentType: mime,
  });
  return blob.url;
}

async function main() {
  const rows = await sql`
    SELECT id, "twitterHandle", "bannerImage"
    FROM "User"
    WHERE "bannerImage" LIKE 'data:image%'
  `;

  console.log(`Found ${rows.length} users with base64 banners.\n`);

  for (const row of rows) {
    console.log(`Processing @${row.twitterHandle} (${row.id})...`);
    try {
      const { mime, b64 } = parseDataUrl(row.bannerImage);
      const ext = mimeToExt[mime] ?? "jpg";
      const filename = `banners/${Date.now()}-${row.id}.${ext}`;

      const blobUrl = await uploadBase64(b64, mime, filename);
      const proxyUrl = `/api/blob/serve?url=${encodeURIComponent(blobUrl)}`;

      await sql`
        UPDATE "User"
        SET "bannerImage" = ${proxyUrl}
        WHERE id = ${row.id}
      `;

      console.log(`  ✓ uploaded → ${proxyUrl.slice(0, 80)}...`);
    } catch (e) {
      console.error(`  ✗ failed: ${e.message}`);
    }
  }

  console.log("\nDone.");
}

main();
