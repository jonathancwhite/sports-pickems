import { fetchFbsScoreboard } from "@callsheet/shared";
import { prisma } from "./client.js";

const SEED_SEASON_YEAR = 2026;
const SEED_WEEKS = [1, 2, 3];

export async function seed() {
  const football = await prisma.sport.upsert({
    where: { slug: "football" },
    create: {
      slug: "football",
      name: "Football",
      active: true,
    },
    update: {},
  });

  const classification = await prisma.classification.upsert({
    where: {
      sportId_slug: {
        sportId: football.id,
        slug: "ncaa-fbs",
      },
    },
    create: {
      sportId: football.id,
      slug: "ncaa-fbs",
      name: "NCAA FBS",
      tier: "core",
      active: true,
    },
    update: {},
  });

  const season = await prisma.season.upsert({
    where: {
      classificationId_year: {
        classificationId: classification.id,
        year: SEED_SEASON_YEAR,
      },
    },
    create: {
      classificationId: classification.id,
      year: SEED_SEASON_YEAR,
      status: "upcoming",
    },
    update: {
      status: "upcoming",
    },
  });

  console.log(`Seeded: Football / NCAA FBS / ${SEED_SEASON_YEAR} season`);

  let synced = 0;
  const errors: string[] = [];

  for (const week of SEED_WEEKS) {
    try {
      const mappedGames = await fetchFbsScoreboard({
        season: SEED_SEASON_YEAR,
        week,
      });

      for (const mapped of mappedGames) {
        await prisma.game.upsert({
          where: {
            seasonId_externalId: {
              seasonId: season.id,
              externalId: mapped.externalId,
            },
          },
          create: {
            seasonId: season.id,
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
        synced += 1;
      }

      console.log(`  Week ${week}: ${mappedGames.length} games`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Week ${week}: ${message}`);
      console.warn(`  Week ${week} sync failed: ${message}`);
    }
  }

  console.log(`Seeded ${synced} games for weeks ${SEED_WEEKS.join(", ")}`);
  if (errors.length > 0) {
    console.warn(`Seed sync errors: ${errors.join("; ")}`);
  }
}
