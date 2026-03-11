import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.userId as string | undefined;
  const twitterHandle = (session?.user as any)?.twitterHandle as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { proof, merkle_root, nullifier_hash, verification_level } = body;

  if (!proof || !merkle_root || !nullifier_hash || !verification_level) {
    return NextResponse.json({ error: "Missing proof fields" }, { status: 400 });
  }

  // Prevent same World ID from verifying twice (across all users)
  const existing = await db.user.findFirst({
    where: { worldIdNullifier: nullifier_hash },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "This World ID has already been used to verify an account." }, { status: 400 });
  }

  // Verify proof with Worldcoin cloud API
  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
  const action = process.env.NEXT_PUBLIC_WORLDCOIN_ACTION ?? "verify-human";

  if (!appId) {
    return NextResponse.json({ error: "World ID not configured." }, { status: 500 });
  }

  const verifyRes = await fetch(`https://developer.worldcoin.org/api/v2/verify/${appId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      signal: userId,
      nullifier_hash,
      merkle_root,
      proof,
      verification_level,
    }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    return NextResponse.json({ error: err.detail ?? "World ID verification failed" }, { status: 400 });
  }

  await db.user.update({
    where: { id: userId },
    data: {
      humanVerified: true,
      worldIdNullifier: nullifier_hash,
      worldIdLevel: verification_level,
    },
  });

  if (twitterHandle) {
    revalidatePath(`/u/${twitterHandle}`);
    revalidatePath("/talent");
  }

  return NextResponse.json({ ok: true, level: verification_level });
}
