import { prisma } from "@callsheet/db";
import type { SportWithClassifications } from "@callsheet/shared";

export async function listSports(): Promise<SportWithClassifications[]> {
  const sports = await prisma.sport.findMany({
    where: { active: true },
    include: {
      classifications: {
        where: { active: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return sports.map((sport) => ({
    id: sport.id,
    slug: sport.slug,
    name: sport.name,
    active: sport.active,
    classifications: sport.classifications.map((classification) => ({
      id: classification.id,
      slug: classification.slug,
      name: classification.name,
      tier: classification.tier,
      active: classification.active,
    })),
  }));
}
