import type { Absurd } from "absurd-sdk";
import {
  runNotifyCommissionerTransfer,
  runNotifySeasonEnded,
  runNotifySlateChange,
  runPickReminders,
  runSendSeasonInvites,
  type NotifyCommissionerTransferParams,
  type NotifySeasonEndedParams,
  type SendSeasonInvitesParams,
  type SlateChangeParams,
} from "./notifications.js";

export function registerTasks(app: Absurd): void {
  app.registerTask({ name: "pick-reminders" }, async (_params, ctx) => {
    return ctx.step("send-reminders", () => runPickReminders());
  });

  app.registerTask({ name: "notify-slate-change" }, async (params: SlateChangeParams, ctx) => {
    return ctx.step("send-notifications", () => runNotifySlateChange(params));
  });

  app.registerTask({ name: "send-season-invites" }, async (params: SendSeasonInvitesParams, ctx) => {
    return ctx.step("send-season-invites", () => runSendSeasonInvites(params));
  });

  app.registerTask({ name: "notify-season-ended" }, async (params: NotifySeasonEndedParams, ctx) => {
    return ctx.step("notify-season-ended", () => runNotifySeasonEnded(params));
  });

  app.registerTask(
    { name: "notify-commissioner-transfer" },
    async (params: NotifyCommissionerTransferParams, ctx) => {
      return ctx.step("notify-commissioner-transfer", () =>
        runNotifyCommissionerTransfer(params),
      );
    },
  );
}
