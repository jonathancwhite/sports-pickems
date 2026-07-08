import { Resend } from "resend";

let resend: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!resend) {
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const from = process.env.EMAIL_FROM ?? "noreply@callsheet.app";
  const client = getResendClient();
  return client.emails.send({ from, to, subject, html });
}

export interface WaitlistInviteEmailData {
  leagueName: string;
  inviteUrl: string;
  expiresAt: Date;
}

export function waitlistInviteEmailHtml({
  leagueName,
  inviteUrl,
  expiresAt,
}: WaitlistInviteEmailData): string {
  const expiresLabel = expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">Callsheet</h1>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <h2 style="margin: 0 0 12px; font-size: 18px;">A spot opened in ${leagueName}</h2>
    <p style="margin: 0 0 16px;">You're next on the waitlist! Join within 48 hours before the spot is offered to someone else.</p>
    <p style="margin: 0 0 24px;">
      <a href="${inviteUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">Join league</a>
    </p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">This invitation expires ${expiresLabel}.</p>
  </div>
</body>
</html>`.trim();
}

export async function sendWaitlistInviteEmail(
  to: string,
  data: WaitlistInviteEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `A spot opened in ${data.leagueName}`,
    html: waitlistInviteEmailHtml(data),
  });
}
