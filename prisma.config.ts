import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Load .env.local synchronously before config is evaluated
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Neon: pooler URL (used at runtime) doesn't accept TCP connections from Prisma CLI.
// Strip "-pooler" from the hostname and add channel_binding=require for direct TCP.
function cliUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  return base
    .replace("-pooler", "")
    .replace("sslmode=require", "sslmode=require&channel_binding=require");
}

export default defineConfig({
  schema: path.resolve(process.cwd(), "prisma/schema.prisma"),
  datasource: {
    url: cliUrl(),
  },
});
