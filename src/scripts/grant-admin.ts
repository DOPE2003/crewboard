import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const identifier = process.argv[2];

if (!identifier) {
  console.error("Please provide a twitter handle or email: npx tsx src/scripts/grant-admin.ts name@example.com");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Find user by twitter handle OR email
  const user = await db.user.findFirst({
    where: {
      OR: [
        { twitterHandle: identifier },
        { email: identifier.toLowerCase() }
      ]
    },
  });

  if (!user) {
    console.error(`User with identifier "${identifier}" not found in database.`);
    process.exit(1);
  }

  const nextStatus = !user.isAdmin;

  await db.user.update({
    where: { id: user.id },
    data: { isAdmin: nextStatus },
  });

  console.log(`Success! User "${identifier}" isAdmin is now: ${nextStatus}`);
}

main()
  .catch((e) => console.error(e));
