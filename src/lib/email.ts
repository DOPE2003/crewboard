import { Resend } from "resend";

const FROM = "Crewboard <noreply@crewboard.xyz>";
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendWelcomeEmail({
  to,
  name,
  handle,
}: {
  to: string;
  name: string;
  handle: string;
}) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Crewboard",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 8px">Welcome, ${name}!</h2>
        <p style="color:#475569">Your Crewboard ID is <strong>@${handle}</strong>.</p>
        <p style="color:#475569">Complete your profile to appear in the freelancer directory and start connecting with Web3 builders.</p>
        <a href="https://crewboard.xyz/onboarding" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">Complete Profile</a>
        <p style="margin-top:32px;font-size:0.8rem;color:#94a3b8">You'll receive notifications about orders, messages, and platform updates at this email.</p>
      </div>
    `,
  });
}

export async function sendNotificationEmail({
  to,
  subject,
  title,
  body,
  link,
}: {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
}) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 8px">${title}</h2>
        <p style="color:#475569">${body}</p>
        ${link ? `<a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2dd4bf;color:#0f172a;font-weight:700;border-radius:8px;text-decoration:none;">View</a>` : ""}
        <p style="margin-top:32px;font-size:0.8rem;color:#94a3b8">Crewboard · <a href="https://crewboard.xyz" style="color:#94a3b8">crewboard.xyz</a></p>
      </div>
    `,
  });
}
