import db from "@/lib/db";
import { randomUUID } from "crypto";
import { PortfolioItem } from "@/actions/portfolio";

/**
 * Automatically prepends a portfolio item to the seller's portfolio when an
 * order is completed and payment is confirmed. Called from both the web server
 * action and the mobile API route — errors are swallowed so they never block
 * the payment confirmation response.
 */
export async function addOrderToPortfolio(
  sellerId: string,
  opts: {
    title: string;
    category: string;
    imageUrl?: string | null;
    amount: number;
  },
) {
  const user = await db.user.findUnique({
    where: { id: sellerId },
    select: { portfolioItems: true },
  });
  if (!user) return;

  const existing = (user.portfolioItems as unknown as PortfolioItem[]) ?? [];

  const newItem: PortfolioItem = {
    id: randomUUID(),
    title: opts.title,
    description: `${opts.category} · ${opts.amount} USDC`,
    year: new Date().getFullYear().toString(),
    ...(opts.imageUrl
      ? { mediaUrl: opts.imageUrl, mediaType: "image" as const }
      : {}),
  };

  await db.user.update({
    where: { id: sellerId },
    data: { portfolioItems: [newItem, ...existing] as any },
  });
}
