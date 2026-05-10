import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const users = await sql`
    SELECT 
      u."twitterHandle", u.name, u."userTitle", u.skills, u.availability, u."portfolioItems",
      (SELECT COUNT(*) FROM "Order" o WHERE o."sellerId" = u.id AND o.status = 'completed') as completed_jobs,
      (SELECT COALESCE(AVG(r.rating::float), 0) FROM "Review" r WHERE r."revieweeId" = u.id) as avg_rating,
      (SELECT COUNT(*) FROM "Review" r WHERE r."revieweeId" = u.id) as review_count
    FROM "User" u
    WHERE u."twitterHandle" IN ('0xmambich', 'mehdi', 'alphaeth')
  `;
  users.forEach((u: any) => {
    const portfolioVideos = (u.portfolioItems || []).filter((i: any) => i?.mediaType === "video");
    console.log(`@${u.twitterHandle} | ${u.name} | ${u.userTitle} | avail: ${u.availability}`);
    console.log(`  Skills: ${(u.skills || []).join(", ")}`);
    console.log(`  Jobs: ${u.completed_jobs} | Rating: ${parseFloat(u.avg_rating).toFixed(1)} | Reviews: ${u.review_count}`);
    portfolioVideos.forEach((v: any, i: number) => console.log(`  Video[${i}]: title="${v.title}" url=${v.mediaUrl}`));
    console.log();
  });
}
main().catch(console.error);
