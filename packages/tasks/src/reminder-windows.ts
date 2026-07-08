export type PickReminderType = "pick_reminder_48h" | "pick_reminder_6h";

export function getApplicablePickReminders(hoursUntilKickoff: number): PickReminderType[] {
  const reminders: PickReminderType[] = [];

  if (hoursUntilKickoff >= 47.5 && hoursUntilKickoff <= 48.5) {
    reminders.push("pick_reminder_48h");
  }

  if (hoursUntilKickoff >= 5.75 && hoursUntilKickoff <= 6.25) {
    reminders.push("pick_reminder_6h");
  }

  return reminders;
}
