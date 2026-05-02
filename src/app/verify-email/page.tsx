import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function verifyToken(token: string): Promise<"ok" | "expired" | "invalid"> {
  const record = await db.emailVerifyToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!record) return "invalid";
  if (record.expiresAt < new Date()) {
    await db.emailVerifyToken.delete({ where: { token } }).catch(() => {});
    return "expired";
  }

  await db.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });
  await db.emailVerifyToken.delete({ where: { token } }).catch(() => {});
  return "ok";
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <StatusPage status="invalid" />;
  }

  const result = await verifyToken(token);
  return <StatusPage status={result} />;
}

function StatusPage({ status }: { status: "ok" | "expired" | "invalid" }) {
  const config = {
    ok: {
      icon: "✓",
      iconColor: "#22c55e",
      title: "Email verified",
      body: "Your email address has been confirmed. You can now use all Crewboard features.",
      cta: "Go to Crewboard",
      href: "/",
    },
    expired: {
      icon: "⏱",
      iconColor: "#f59e0b",
      title: "Link expired",
      body: "This verification link has expired (links are valid for 24 hours). Request a new one from the app.",
      cta: "Back to home",
      href: "/",
    },
    invalid: {
      icon: "✕",
      iconColor: "#ef4444",
      title: "Invalid link",
      body: "This verification link is not valid or has already been used.",
      cta: "Back to home",
      href: "/",
    },
  }[status];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f8fafc",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        padding: "48px 40px",
        maxWidth: 440,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: `${config.iconColor}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          fontSize: 28,
          color: config.iconColor,
          fontWeight: 700,
        }}>
          {config.icon}
        </div>
        <h1 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
          {config.title}
        </h1>
        <p style={{ margin: "0 0 32px", fontSize: 15, color: "#64748b", lineHeight: 1.6 }}>
          {config.body}
        </p>
        <Link href={config.href} style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "#2dd4bf",
          color: "#0f172a",
          fontWeight: 700,
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 15,
        }}>
          {config.cta}
        </Link>
      </div>
    </div>
  );
}
