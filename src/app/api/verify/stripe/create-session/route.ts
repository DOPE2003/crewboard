export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import getStripe from "@/lib/stripe";

export async function POST() {
  const stripe = getStripe();
  const session = await auth();
  const userId = (session?.user as { userId?: string })?.userId;
  const twitterHandle = (session?.user as { twitterHandle?: string })?.twitterHandle;

  if (!userId || !twitterHandle) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.AUTH_URL ?? "https://crewboard-beryl.vercel.app";

  const verificationSession = await stripe.identity.verificationSessions.create({
    type: "document",
    options: {
      document: {
        require_matching_selfie: true,
      },
    },
    metadata: { userId, twitterHandle },
    return_url: `${baseUrl}/u/${twitterHandle}?verified=pending`,
  });

  return NextResponse.json({ url: verificationSession.url });
}
