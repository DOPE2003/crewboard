import { PrismaClient, Role } from "../lib/generated/prisma/client";
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

  const nextRole = user.role === Role.ADMIN ? Role.USER : Role.ADMIN;

  await db.user.update({
    where: { id: user.id },
    data: { role: nextRole },
  });

  console.log(`Success! User "${identifier}" role is now: ${nextRole}`);
}

main()
  .catch((e) => console.error(e));
