import type { Absurd } from "absurd-sdk";
import { runNotifySlateChange, runPickReminders, type SlateChangeParams } from "./notifications.js";

export function registerTasks(app: Absurd): void {
  app.registerTask({ name: "pick-reminders" }, async (_params, ctx) => {
    return ctx.step("send-reminders", () => runPickReminders());
  });

  app.registerTask({ name: "notify-slate-change" }, async (params: SlateChangeParams, ctx) => {
    return ctx.step("send-notifications", () => runNotifySlateChange(params));
  });
}
