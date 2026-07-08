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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailLayout(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: #2563eb; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">Callsheet</h1>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    ${body}
  </div>
</body>
</html>`.trim();
}

function ctaButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `<a href="${safeHref}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">${safeLabel}</a>`;
}

export interface PickReminderEmailData {
  leagueName: string;
  week: number;
  unpickedCount: number;
  picksUrl: string;
}

export function pickReminder48hEmailHtml(data: PickReminderEmailData): string {
  const leagueName = escapeHtml(data.leagueName);
  const picksUrl = escapeHtml(data.picksUrl);
  const gameLabel = data.unpickedCount === 1 ? "game" : "games";

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">You have unpicked games this week</h2>
    <p style="margin: 0 0 16px;">
      Week ${data.week} in <strong>${leagueName}</strong> starts in about 48 hours.
      You still have <strong>${data.unpickedCount}</strong> unpicked ${gameLabel}.
    </p>
    <p style="margin: 0 0 24px;">${ctaButton("Make your picks", picksUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Don't miss the deadline — games lock at kickoff.</p>
  `);
}

export function pickReminder6hEmailHtml(data: PickReminderEmailData): string {
  const leagueName = escapeHtml(data.leagueName);
  const picksUrl = escapeHtml(data.picksUrl);
  const gameLabel = data.unpickedCount === 1 ? "game" : "games";

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">Last chance — games start in 6 hours</h2>
    <p style="margin: 0 0 16px;">
      Week ${data.week} in <strong>${leagueName}</strong> is about to begin.
      You still have <strong>${data.unpickedCount}</strong> unpicked ${gameLabel}.
    </p>
    <p style="margin: 0 0 24px;">${ctaButton("Make your picks now", picksUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Picks lock when each game kicks off.</p>
  `);
}

export async function sendPickReminder48hEmail(
  to: string,
  data: PickReminderEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `Reminder: ${data.unpickedCount} unpicked games in ${data.leagueName}`,
    html: pickReminder48hEmailHtml(data),
  });
}

export async function sendPickReminder6hEmail(
  to: string,
  data: PickReminderEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `Last chance: picks due soon in ${data.leagueName}`,
    html: pickReminder6hEmailHtml(data),
  });
}

export interface SlateChangeEmailData {
  leagueName: string;
  week: number;
  removedGames: Array<{ homeTeam: string; awayTeam: string }>;
  picksUrl: string;
}

export function slateChangeEmailHtml(data: SlateChangeEmailData): string {
  const leagueName = escapeHtml(data.leagueName);
  const picksUrl = escapeHtml(data.picksUrl);
  const gameList = data.removedGames
    .map(
      (game) =>
        `<li>${escapeHtml(game.awayTeam)} @ ${escapeHtml(game.homeTeam)}</li>`,
    )
    .join("");

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">Games removed from this week's slate</h2>
    <p style="margin: 0 0 16px;">
      The commissioner updated Week ${data.week} in <strong>${leagueName}</strong>.
      These games were removed and your picks on them were cleared:
    </p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">${gameList}</ul>
    <p style="margin: 0 0 24px;">${ctaButton("Update your picks", picksUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Please review the updated slate and re-pick if needed.</p>
  `);
}

export async function sendSlateChangeEmail(
  to: string,
  data: SlateChangeEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `Slate updated in ${data.leagueName} — please re-pick`,
    html: slateChangeEmailHtml(data),
  });
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
  const safeLeagueName = escapeHtml(leagueName);
  const safeInviteUrl = escapeHtml(inviteUrl);
  const expiresLabel = escapeHtml(
    expiresAt.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  );

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">A spot opened in ${safeLeagueName}</h2>
    <p style="margin: 0 0 16px;">You're next on the waitlist! Join within 48 hours before the spot is offered to someone else.</p>
    <p style="margin: 0 0 24px;">${ctaButton("Join league", safeInviteUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">This invitation expires ${expiresLabel}.</p>
  `);
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

export interface CommissionerTransferEmailData {
  leagueName: string;
  acceptUrl: string;
}

export function commissionerTransferEmailHtml(data: CommissionerTransferEmailData): string {
  const leagueName = escapeHtml(data.leagueName);
  const acceptUrl = escapeHtml(data.acceptUrl);

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">Commissioner transfer request</h2>
    <p style="margin: 0 0 16px;">
      You've been asked to become the commissioner of <strong>${leagueName}</strong>.
    </p>
    <p style="margin: 0 0 24px;">${ctaButton("Accept commissioner role", acceptUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">If you weren't expecting this, you can ignore this email.</p>
  `);
}

export async function sendCommissionerTransferEmail(
  to: string,
  data: CommissionerTransferEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `You've been asked to become commissioner of ${data.leagueName}`,
    html: commissionerTransferEmailHtml(data),
  });
}

export interface SeasonInviteEmailData {
  leagueName: string;
  joinUrl: string;
}

export function seasonInviteEmailHtml(data: SeasonInviteEmailData): string {
  const leagueName = escapeHtml(data.leagueName);
  const joinUrl = escapeHtml(data.joinUrl);

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">A new season is starting</h2>
    <p style="margin: 0 0 16px;">
      <strong>${leagueName}</strong> is kicking off a new season. Rejoin now to keep playing with your league.
    </p>
    <p style="margin: 0 0 24px;">${ctaButton("Rejoin league", joinUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Your previous season stats are saved in league history.</p>
  `);
}

export async function sendSeasonInviteEmail(
  to: string,
  data: SeasonInviteEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `A new season of ${data.leagueName} is starting — rejoin now`,
    html: seasonInviteEmailHtml(data),
  });
}

export interface SeasonEndedEmailData {
  leagueName: string;
  settingsUrl: string;
}

export function seasonEndedEmailHtml(data: SeasonEndedEmailData): string {
  const leagueName = escapeHtml(data.leagueName);
  const settingsUrl = escapeHtml(data.settingsUrl);

  return emailLayout(`
    <h2 style="margin: 0 0 12px; font-size: 18px;">Your season has ended</h2>
    <p style="margin: 0 0 16px;">
      All games are final in <strong>${leagueName}</strong>. Your league will be archived soon.
    </p>
    <p style="margin: 0 0 24px;">${ctaButton("Start a new season", settingsUrl)}</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Previous season standings are saved in league history.</p>
  `);
}

export async function sendSeasonEndedEmail(
  to: string,
  data: SeasonEndedEmailData,
): Promise<void> {
  await sendEmail({
    to,
    subject: `Season complete in ${data.leagueName} — start a new one?`,
    html: seasonEndedEmailHtml(data),
  });
}
