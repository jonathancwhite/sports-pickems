import { prisma } from "@callsheet/db";
import type { Game, GamesQuery, SyncGamesRequest, SyncGamesResponse } from "@callsheet/shared";
import {
  fetchFbsRegularSeasonWeeks,
  fetchFbsScoreboard,
  type MappedGame,
} from "@callsheet/shared";

const FBS_CLASSIFICATION_SLUG = "ncaa-fbs";
const COMPLETED_GAME_RETENTION_DAYS = 7;

export class GamesServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "GamesServiceError";
  }
}

async function resolveFbsClassification(classificationId?: string) {
  if (classificationId) {
    const classification = await prisma.classification.findUnique({
      where: { id: classificationId },
    });
    if (!classification) {
      throw new GamesServiceError("Classification not found", 404, "classification_not_found");
    }
    return classification;
  }

  const classification = await prisma.classification.findFirst({
    where: { slug: FBS_CLASSIFICATION_SLUG, active: true },
  });
  if (!classification) {
    throw new GamesServiceError(
      "FBS classification not found — run db:seed first",
      500,
      "classification_not_seeded",
    );
  }
  return classification;
}

async function resolveSeason(classificationId: string, seasonYear: number) {
  const season = await prisma.season.findUnique({
    where: {
      classificationId_year: {
        classificationId,
        year: seasonYear,
      },
    },
  });

  if (!season) {
    throw new GamesServiceError(
      `Season ${seasonYear} not found for classification`,
      404,
      "season_not_found",
    );
  }

  return season;
}

function toApiGame(game: {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string | null;
  awayTeamAbbr: string | null;
  startTime: Date;
  week: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
}): Game {
  return {
    id: game.id,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeTeamAbbr: game.homeTeamAbbr,
    awayTeamAbbr: game.awayTeamAbbr,
    startTime: game.startTime.toISOString(),
    week: game.week,
    status: game.status as Game["status"],
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    winner: game.winner as Game["winner"],
  };
}

async function upsertMappedGame(seasonId: string, mapped: MappedGame): Promise<"created" | "updated"> {
  const existing = await prisma.game.findUnique({
    where: {
      seasonId_externalId: {
        seasonId,
        externalId: mapped.externalId,
      },
    },
    select: { id: true },
  });

  await prisma.game.upsert({
    where: {
      seasonId_externalId: {
        seasonId,
        externalId: mapped.externalId,
      },
    },
    create: {
      seasonId,
      externalId: mapped.externalId,
      week: mapped.week,
      homeTeam: mapped.homeTeam,
      awayTeam: mapped.awayTeam,
      homeTeamAbbr: mapped.homeTeamAbbr,
      awayTeamAbbr: mapped.awayTeamAbbr,
      startTime: mapped.startTime,
      status: mapped.status,
      homeScore: mapped.homeScore,
      awayScore: mapped.awayScore,
      winner: mapped.winner,
    },
    update: {
      week: mapped.week,
      homeTeam: mapped.homeTeam,
      awayTeam: mapped.awayTeam,
      homeTeamAbbr: mapped.homeTeamAbbr,
      awayTeamAbbr: mapped.awayTeamAbbr,
      startTime: mapped.startTime,
      status: mapped.status,
      homeScore: mapped.homeScore,
      awayScore: mapped.awayScore,
      winner: mapped.winner,
      updatedAt: new Date(),
    },
  });

  return existing ? "updated" : "created";
}

export async function syncGames(input: SyncGamesRequest = {}): Promise<SyncGamesResponse> {
  const classification = await resolveFbsClassification(input.classificationId);
  const seasonYear = input.seasonYear ?? new Date().getFullYear();
  const season = await resolveSeason(classification.id, seasonYear);

  const weeks = input.week
    ? [input.week]
    : await fetchFbsRegularSeasonWeeks(seasonYear);

  let synced = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const week of weeks) {
    try {
      const mappedGames = await fetchFbsScoreboard({ season: seasonYear, week });

      for (const mapped of mappedGames) {
        const result = await upsertMappedGame(season.id, mapped);
        if (result === "created") {
          synced += 1;
        } else {
          updated += 1;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";
      errors.push(`Week ${week}: ${message}`);
    }
  }

  console.log(
    `[sync-games] season=${seasonYear} weeks=${weeks.length} synced=${synced} updated=${updated} errors=${errors.length}`,
  );

  return { synced, updated, errors };
}

export async function listGames(query: GamesQuery): Promise<{ games: Game[] }> {
  const season = await prisma.season.findUnique({
    where: { id: query.seasonId },
  });

  if (!season) {
    throw new GamesServiceError("Season not found", 404, "season_not_found");
  }

  if (query.classificationId && season.classificationId !== query.classificationId) {
    throw new GamesServiceError(
      "Season does not belong to the specified classification",
      400,
      "classification_mismatch",
    );
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COMPLETED_GAME_RETENTION_DAYS);

  const games = await prisma.game.findMany({
    where: {
      seasonId: query.seasonId,
      week: query.week,
      OR: [
        { status: { not: "final" } },
        { startTime: { gte: cutoff } },
      ],
    },
    orderBy: { startTime: "asc" },
  });

  return {
    games: games.map(toApiGame),
  };
}
