export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import getStripe from "@/lib/stripe";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "identity.verification_session.verified") {
    const session = event.data.object as { id: string; metadata?: { userId?: string; twitterHandle?: string } };
    const userId = session.metadata?.userId;
    const twitterHandle = session.metadata?.twitterHandle;

    if (!userId) {
      return NextResponse.json({ error: "No userId in metadata" }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        humanVerified: true,
        worldIdLevel: "stripe",
        stripeVerificationId: session.id,
      },
    });

    await db.notification.create({
      data: {
        userId,
        type: "identity_verified",
        title: "Identity Verified",
        body: "Your identity has been verified via Stripe Identity. An ID Verified badge now appears on your profile.",
      },
    });

    if (twitterHandle) {
      revalidatePath(`/u/${twitterHandle}`);
      revalidatePath("/talent");
    }
  }

  return NextResponse.json({ received: true });
}
