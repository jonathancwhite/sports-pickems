import { fetchScoreboard } from "@callsheet/shared";
import { prisma } from "./client.js";
import { CATALOG_SEASON_YEAR, seedCatalog } from "./seed-catalog.js";

const SEED_SEASON_YEAR = CATALOG_SEASON_YEAR;
const SEED_WEEKS = [1, 2, 3];

/**
 * Classifications the dev seed pulls real games for. Each must exist in the
 * catalog seed and have a `LeagueConfig` in `@callsheet/shared`.
 *
 * Note ESPN's scoreboard returns the *current* season whatever `year` is sent,
 * so these are the current season's games regardless of `SEED_SEASON_YEAR`.
 */
const SEED_CLASSIFICATIONS = [
  { slug: "ncaa-fbs", label: "NCAA FBS" },
  { slug: "nfl", label: "NFL" },
] as const;

export async function seed() {
  await seedCatalog();

  let totalSynced = 0;
  const errors: string[] = [];

  for (const { slug, label } of SEED_CLASSIFICATIONS) {
    const season = await prisma.season.findFirst({
      where: {
        year: SEED_SEASON_YEAR,
        classification: { slug, sport: { slug: "football" } },
      },
    });

    if (!season) {
      const message = `${label}: no ${SEED_SEASON_YEAR} season row`;
      errors.push(message);
      console.warn(`  ${message}`);
      continue;
    }

    console.log(`${label} / ${SEED_SEASON_YEAR} season`);
    let synced = 0;

    for (const week of SEED_WEEKS) {
      try {
        const { games: mappedGames, errors: mappingErrors } = await fetchScoreboard(
          slug,
          {
            season: SEED_SEASON_YEAR,
            week,
          },
        );

        for (const mappingError of mappingErrors) {
          errors.push(`${label} week ${week}, ${mappingError}`);
        }

        for (const mapped of mappedGames) {
          const fields = {
            week: mapped.week,
            homeTeam: mapped.homeTeam,
            awayTeam: mapped.awayTeam,
            homeTeamAbbr: mapped.homeTeamAbbr,
            awayTeamAbbr: mapped.awayTeamAbbr,
            homeTeamLogo: mapped.homeTeamLogo,
            awayTeamLogo: mapped.awayTeamLogo,
            homeGroup: mapped.homeGroup,
            awayGroup: mapped.awayGroup,
            startTime: mapped.startTime,
            status: mapped.status,
            homeScore: mapped.homeScore,
            awayScore: mapped.awayScore,
            winner: mapped.winner,
          };

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
              ...fields,
            },
            update: {
              ...fields,
              updatedAt: new Date(),
            },
          });
          synced += 1;
        }

        console.log(`  Week ${week}: ${mappedGames.length} games`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${label} week ${week}: ${message}`);
        console.warn(`  Week ${week} sync failed: ${message}`);
      }
    }

    console.log(`  Seeded ${synced} ${label} games for weeks ${SEED_WEEKS.join(", ")}`);
    totalSynced += synced;
  }

  console.log(
    `Seeded ${totalSynced} games across ${SEED_CLASSIFICATIONS.length} classifications`,
  );
  if (errors.length > 0) {
    console.warn(`Seed sync errors: ${errors.join("; ")}`);
  }
}
