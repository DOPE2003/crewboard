import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const users = await db.user.findMany({
    where: { profileComplete: true },
    select: { id: true, twitterHandle: true },
  });

  console.log(`Sending notifications to ${users.length} users...`);

  await db.notification.createMany({
    data: users.map((u) => ({
      userId:  u.id,
      type:    "system",
      title:   "Update your profile role",
      body:    "We updated our role categories to better match Web3 skills. Please visit your dashboard and re-select your role so you appear in the right category.",
      link:    "/dashboard",
    })),
  });

  console.log("Done.");
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
