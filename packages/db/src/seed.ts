import { prisma } from "./client.js";

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

  const currentYear = new Date().getFullYear();

  await prisma.season.upsert({
    where: {
      classificationId_year: {
        classificationId: classification.id,
        year: currentYear,
      },
    },
    create: {
      classificationId: classification.id,
      year: currentYear,
      status: "upcoming",
    },
    update: {},
  });

  console.log(`Seeded: Football / NCAA FBS / ${currentYear} season`);
}
