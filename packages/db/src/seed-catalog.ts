import { prisma } from "./client.js";

/**
 * The season every seeded classification gets a row for. Game sync is
 * deliberately strict about missing seasons — it throws `season_not_found`
 * rather than inventing one — so the catalog seed has to supply them.
 */
export const CATALOG_SEASON_YEAR = 2026;

/**
 * Classifications under the `football` sport.
 *
 * `tier: core` on both is deliberate: NFL is free for everyone. The Pro tier
 * sells on league count and member cap, and NFL costs nothing extra to
 * support — it is the same free ESPN API.
 */
const FOOTBALL_CLASSIFICATIONS = [
  { slug: "ncaa-fbs", name: "NCAA FBS" },
  { slug: "nfl", name: "NFL" },
] as const;

/**
 * Production-safe seed: sports, classifications and their current season only
 * (no test game data).
 */
export async function seedCatalog() {
  const football = await prisma.sport.upsert({
    where: { slug: "football" },
    create: {
      slug: "football",
      name: "Football",
      active: true,
    },
    update: {},
  });

  for (const { slug, name } of FOOTBALL_CLASSIFICATIONS) {
    const classification = await prisma.classification.upsert({
      where: {
        sportId_slug: {
          sportId: football.id,
          slug,
        },
      },
      create: {
        sportId: football.id,
        slug,
        name,
        tier: "core",
        active: true,
      },
      update: {},
    });

    await prisma.season.upsert({
      where: {
        classificationId_year: {
          classificationId: classification.id,
          year: CATALOG_SEASON_YEAR,
        },
      },
      create: {
        classificationId: classification.id,
        year: CATALOG_SEASON_YEAR,
        status: "upcoming",
      },
      update: {},
    });
  }

  const names = FOOTBALL_CLASSIFICATIONS.map((c) => c.name).join(", ");
  console.log(
    `Seeded catalog: ${football.name} / ${names} / ${CATALOG_SEASON_YEAR} season`,
  );
}
