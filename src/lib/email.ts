import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Crewboard <onboarding@resend.dev>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://crewboard.fun";

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set — all emails disabled");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function shell(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f8fafc;">
<div style="font-family:sans-serif;max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:#0f172a;padding:22px 28px;">
    <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px;">crew<span style="color:#2dd4bf;">board</span></span>
  </div>
  <div style="padding:32px 28px;">${content}</div>
  <div style="padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
    You're receiving this because you have an account on <a href="${BASE_URL}" style="color:#2dd4bf;text-decoration:none;">crewboard.fun</a>
  </div>
</div></body></html>`;
}

async function send(to: string, subject: string, content: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  if (!process.env.EMAIL_FROM) {
    console.warn(
      "[email] EMAIL_FROM not set — falling back to onboarding@resend.dev." +
      " This test domain only delivers to the Resend account owner." +
      " Set EMAIL_FROM=Crewboard <notifications@crewboard.fun> in Vercel env vars."
    );
  }

  console.log(`[email] Sending "${subject}" → ${to} (from: ${FROM})`);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: shell(content),
    });

    if (error) {
      console.error("[email] Resend rejected the request →", JSON.stringify(error));
      return;
    }

    console.log("[email] Delivered — Resend id:", data?.id);
  } catch (err) {
    console.error("[email] Unexpected error sending to", to, "→", err);
  }
}

export async function sendWelcomeEmail({
  to, name, handle,
}: { to: string; name: string; handle: string }) {
  return send(to, "Welcome to Crewboard", `
    <h2 style="margin:0 0 10px;color:#0f172a;">Welcome, ${name}!</h2>
    <p style="color:#475569;line-height:1.7;">Your Crewboard ID is <strong>@${handle}</strong>.</p>
    <p style="color:#475569;line-height:1.7;">Complete your profile to appear in the freelancer directory and start connecting with Web3 builders.</p>
    <a href="${BASE_URL}/onboarding" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">Complete Profile</a>
    <p style="margin-top:28px;font-size:13px;color:#94a3b8;">You'll receive notifications about orders, messages, and platform updates at this email.</p>
  `);
}

export async function sendNotificationEmail({
  to, subject, title, body, link, linkLabel,
}: { to: string; subject: string; title: string; body: string; link?: string; linkLabel?: string }) {
  return send(to, subject, `
    <h2 style="margin:0 0 10px;font-size:20px;color:#0f172a;">${title}</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">${body}</p>
    ${link ? `<a href="${link}" style="display:inline-block;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">${linkLabel ?? "View on Crewboard"}</a>` : ""}
  `);
}

export async function sendMessageNotification({
  to, senderName, preview, conversationId,
}: { to: string; senderName: string; preview: string; conversationId: string }) {
  return send(
    to,
    `New message from ${senderName} on Crewboard`,
    `
    <h2 style="margin:0 0 10px;font-size:20px;color:#0f172a;">You have a new message</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 6px;">
      <strong style="color:#0f172a;">${senderName}</strong> sent you a message:
    </p>
    <div style="background:#f8fafc;border-left:3px solid #2dd4bf;padding:10px 16px;border-radius:0 8px 8px 0;margin:0 0 24px;font-style:italic;color:#334155;">${preview}</div>
    <a href="${BASE_URL}/messages/${conversationId}" style="display:inline-block;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">Reply on Crewboard</a>
    `
  );
}

export async function sendServiceRequestNotification({
  to, buyerName, gigTitle, conversationId,
}: { to: string; buyerName: string; gigTitle: string; conversationId: string }) {
  return send(
    to,
    `Your service "${gigTitle}" is wanted — Crewboard`,
    `
    <h2 style="margin:0 0 10px;font-size:20px;color:#0f172a;">Your service is wanted!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 6px;">
      <strong style="color:#0f172a;">${buyerName}</strong> is interested in your service:
    </p>
    <div style="background:#f8fafc;border-left:3px solid #2dd4bf;padding:10px 16px;border-radius:0 8px 8px 0;margin:0 0 24px;font-size:15px;font-weight:600;color:#0f172a;">${gigTitle}</div>
    <a href="${BASE_URL}/messages/${conversationId}" style="display:inline-block;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">View Request</a>
    `
  );
}

export async function sendPasswordResetEmail({
  to, resetUrl,
}: { to: string; resetUrl: string }) {
  return send(to, "Reset your Crewboard password", `
    <h2 style="margin:0 0 10px;font-size:20px;color:#0f172a;">Reset your password</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      We received a request to reset the password for your Crewboard account. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">Reset Password</a>
    <p style="margin-top:28px;font-size:13px;color:#94a3b8;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `);
}

export async function sendEmailVerificationEmail({
  to, verifyUrl,
}: { to: string; verifyUrl: string }) {
  return send(to, "Verify your Crewboard email", `
    <h2 style="margin:0 0 10px;font-size:20px;color:#0f172a;">Verify your email</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Thanks for joining Crewboard! Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.
    </p>
    <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">Verify Email</a>
    <p style="margin-top:28px;font-size:13px;color:#94a3b8;">If you didn't create a Crewboard account, you can safely ignore this email.</p>
  `);
}

export async function sendHireNotification({
  to, buyerName, conversationId,
}: { to: string; buyerName: string; conversationId: string }) {
  return send(
    to,
    `${buyerName} wants to hire you — Crewboard`,
    `
    <h2 style="margin:0 0 10px;font-size:20px;color:#0f172a;">Someone wants to hire you!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      <strong style="color:#0f172a;">${buyerName}</strong> reached out and wants to hire you. Open your inbox to see the details and discuss the project.
    </p>
    <a href="${BASE_URL}/messages/${conversationId}" style="display:inline-block;padding:12px 28px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">View on Crewboard</a>
    `
  );
}
