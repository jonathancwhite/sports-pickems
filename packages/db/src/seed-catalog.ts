import { prisma } from "./client.js";

/**
 * Production-safe seed: sports and classifications only (no test game data).
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

  await prisma.classification.upsert({
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

  console.log("Seeded catalog: Football / NCAA FBS");
}
