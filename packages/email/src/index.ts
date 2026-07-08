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
