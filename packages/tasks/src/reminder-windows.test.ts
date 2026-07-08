import { describe, expect, it } from "vitest";
import { getApplicablePickReminders } from "./reminder-windows.js";

describe("getApplicablePickReminders", () => {
  it("returns 48h reminder inside the ±30min window", () => {
    expect(getApplicablePickReminders(48)).toEqual(["pick_reminder_48h"]);
    expect(getApplicablePickReminders(47.5)).toEqual(["pick_reminder_48h"]);
    expect(getApplicablePickReminders(48.5)).toEqual(["pick_reminder_48h"]);
  });

  it("returns 6h reminder inside the ±15min window", () => {
    expect(getApplicablePickReminders(6)).toEqual(["pick_reminder_6h"]);
    expect(getApplicablePickReminders(5.75)).toEqual(["pick_reminder_6h"]);
    expect(getApplicablePickReminders(6.25)).toEqual(["pick_reminder_6h"]);
  });

  it("returns no reminders outside windows", () => {
    expect(getApplicablePickReminders(24)).toEqual([]);
    expect(getApplicablePickReminders(47.4)).toEqual([]);
    expect(getApplicablePickReminders(48.6)).toEqual([]);
    expect(getApplicablePickReminders(5.7)).toEqual([]);
  });
});
