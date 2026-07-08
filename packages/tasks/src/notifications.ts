import { prisma, type NotificationType } from "@callsheet/db";
import {
  sendCommissionerTransferEmail,
  sendPickReminder48hEmail,
  sendPickReminder6hEmail,
  sendSeasonEndedEmail,
  sendSeasonInviteEmail,
  sendSlateChangeEmail,
} from "@callsheet/email";
import { getApplicablePickReminders } from "./reminder-windows.js";
import {
  getLeagueSettingsUrl,
  getPicksUrl,
  getSeasonJoinUrl,
  getTransferAcceptUrl,
} from "./web-url.js";

function isGameStarted(game: { startTime: Date; status: string }): boolean {
  if (game.status === "in_progress" || game.status === "final") {
    return true;
  }
  return game.startTime <= new Date();
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

async function trySendNotification(
  user: { id: string; email: string },
  leagueId: string,
  type: NotificationType,
  referenceId: string,
  sendFn: () => Promise<void>,
): Promise<boolean> {
  let logId: string | null = null;

  try {
    const log = await prisma.notificationLog.create({
      data: {
        userId: user.id,
        leagueId,
        type,
        referenceId,
      },
    });
    logId = log.id;
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return false;
    }
    throw error;
  }

  try {
    await sendFn();
    return true;
  } catch (error) {
    if (logId) {
      await prisma.notificationLog
        .delete({ where: { id: logId } })
        .catch((deleteError) => {
          console.error(`Failed to roll back notification log ${logId}:`, deleteError);
        });
    }
    console.error(`Failed to send ${type} to ${user.email}:`, error);
    return false;
  }
}

export interface SlateChangeParams {
  leagueId: string;
  leagueName: string;
  week: number;
  removedGames: Array<{ id: string; homeTeam: string; awayTeam: string }>;
  userIds: string[];
}

export async function runPickReminders(): Promise<{ sent48h: number; sent6h: number }> {
  const now = new Date();
  let sent48h = 0;
  let sent6h = 0;

  const leagues = await prisma.league.findMany({
    where: {
      deletedAt: null,
      status: "active",
      currentSeason: { status: "active" },
    },
    select: {
      id: true,
      name: true,
      currentSeasonId: true,
    },
  });

  for (const league of leagues) {
    if (!league.currentSeasonId) {
      continue;
    }

    const slates = await prisma.leagueWeekSlate.findMany({
      where: {
        leagueId: league.id,
        seasonId: league.currentSeasonId,
        lockedAt: null,
      },
      include: {
        games: { include: { game: true } },
      },
    });

    for (const slate of slates) {
      const games = slate.games.map((entry) => entry.game);
      const openGames = games.filter((game) => !isGameStarted(game));

      if (openGames.length === 0) {
        continue;
      }

      const members = await prisma.leagueMember.findMany({
        where: {
          leagueId: league.id,
          seasonId: league.currentSeasonId,
          user: { deletedAt: null },
        },
        include: {
          user: { select: { id: true, email: true } },
        },
      });

      const slateGameIds = games.map((game) => game.id);
      const picks = await prisma.pick.findMany({
        where: {
          leagueId: league.id,
          week: slate.week,
          gameId: { in: slateGameIds },
        },
        select: { userId: true, gameId: true },
      });

      const picksByUser = new Map<string, Set<string>>();
      for (const pick of picks) {
        const userPicks = picksByUser.get(pick.userId) ?? new Set<string>();
        userPicks.add(pick.gameId);
        picksByUser.set(pick.userId, userPicks);
      }

      const picksUrl = getPicksUrl(league.id);
      const referenceId = String(slate.week);

      for (const member of members) {
        const picked = picksByUser.get(member.user.id) ?? new Set<string>();
        const unpickedGames = openGames.filter((game) => !picked.has(game.id));

        if (unpickedGames.length === 0) {
          continue;
        }

        unpickedGames.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const firstUnpicked = unpickedGames[0];
        const hoursUntilKickoff =
          (firstUnpicked.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const emailData = {
          leagueName: league.name,
          week: slate.week,
          unpickedCount: unpickedGames.length,
          picksUrl,
        };

        for (const reminderType of getApplicablePickReminders(hoursUntilKickoff)) {
          const sendFn =
            reminderType === "pick_reminder_48h"
              ? () => sendPickReminder48hEmail(member.user.email, emailData)
              : () => sendPickReminder6hEmail(member.user.email, emailData);

          const sent = await trySendNotification(
            member.user,
            league.id,
            reminderType,
            referenceId,
            sendFn,
          );

          if (sent) {
            if (reminderType === "pick_reminder_48h") {
              sent48h++;
            } else {
              sent6h++;
            }
          }
        }
      }
    }
  }

  return { sent48h, sent6h };
}

export async function runNotifySlateChange(params: SlateChangeParams): Promise<{ sent: number }> {
  const referenceId = `${params.week}:${params.removedGames
    .map((game) => game.id)
    .sort()
    .join(",")}`;
  const picksUrl = getPicksUrl(params.leagueId);
  let sent = 0;

  const users = await prisma.user.findMany({
    where: {
      id: { in: params.userIds },
      deletedAt: null,
    },
    select: { id: true, email: true },
  });

  for (const user of users) {
    const didSend = await trySendNotification(
      user,
      params.leagueId,
      "slate_change",
      referenceId,
      () =>
        sendSlateChangeEmail(user.email, {
          leagueName: params.leagueName,
          week: params.week,
          removedGames: params.removedGames,
          picksUrl,
        }),
    );

    if (didSend) {
      sent++;
    }
  }

  return { sent };
}

export interface SendSeasonInvitesParams {
  leagueId: string;
  seasonId: string;
  previousSeasonId: string;
  leagueName: string;
}

export async function runSendSeasonInvites(
  params: SendSeasonInvitesParams,
): Promise<{ sent: number }> {
  const members = await prisma.leagueMember.findMany({
    where: {
      leagueId: params.leagueId,
      seasonId: params.previousSeasonId,
      role: "member",
      user: { deletedAt: null },
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  const joinUrl = getSeasonJoinUrl(params.leagueId);
  let sent = 0;

  for (const member of members) {
    const didSend = await trySendNotification(
      member.user,
      params.leagueId,
      "season_invite",
      params.seasonId,
      () =>
        sendSeasonInviteEmail(member.user.email, {
          leagueName: params.leagueName,
          joinUrl,
        }),
    );

    if (didSend) {
      sent++;
    }
  }

  return { sent };
}

export interface NotifySeasonEndedParams {
  leagueId: string;
}

export async function runNotifySeasonEnded(
  params: NotifySeasonEndedParams,
): Promise<{ sent: number }> {
  const league = await prisma.league.findFirst({
    where: { id: params.leagueId, deletedAt: null },
    include: {
      commissioner: { select: { id: true, email: true } },
      currentSeason: { select: { id: true } },
    },
  });

  if (!league?.currentSeason) {
    return { sent: 0 };
  }

  const settingsUrl = getLeagueSettingsUrl(params.leagueId);
  const referenceId = league.currentSeason.id;

  const didSend = await trySendNotification(
    league.commissioner,
    params.leagueId,
    "season_ended",
    referenceId,
    () =>
      sendSeasonEndedEmail(league.commissioner.email, {
        leagueName: league.name,
        settingsUrl,
      }),
  );

  return { sent: didSend ? 1 : 0 };
}

export interface NotifyCommissionerTransferParams {
  leagueId: string;
  transferId: string;
  leagueName: string;
  targetEmail: string;
  targetUserId: string;
}

export async function runNotifyCommissionerTransfer(
  params: NotifyCommissionerTransferParams,
): Promise<{ sent: number }> {
  const acceptUrl = getTransferAcceptUrl(params.leagueId);

  const user = await prisma.user.findUnique({
    where: { id: params.targetUserId },
    select: { id: true, email: true },
  });

  if (!user) {
    return { sent: 0 };
  }

  const didSend = await trySendNotification(
    user,
    params.leagueId,
    "commissioner_transfer",
    params.transferId,
    () =>
      sendCommissionerTransferEmail(params.targetEmail, {
        leagueName: params.leagueName,
        acceptUrl,
      }),
  );

  return { sent: didSend ? 1 : 0 };
}
