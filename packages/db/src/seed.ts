import { and, eq } from "drizzle-orm";
import { getDb } from "./client.js";
import {
  classifications,
  seasons,
  sports,
} from "./schema/tables.js";

export async function seed() {
  const db = getDb();

  const [football] = await db
    .insert(sports)
    .values({
      slug: "football",
      name: "Football",
      active: true,
    })
    .onConflictDoNothing({ target: sports.slug })
    .returning();

  let sport = football;
  if (!sport) {
    const rows = await db.select().from(sports).where(eq(sports.slug, "football")).limit(1);
    sport = rows[0];
  }

  if (!sport) {
    throw new Error("Failed to seed football sport");
  }

  const [fbs] = await db
    .insert(classifications)
    .values({
      sportId: sport.id,
      slug: "ncaa-fbs",
      name: "NCAA FBS",
      tier: "core",
      active: true,
    })
    .onConflictDoNothing()
    .returning();

  let classification = fbs;
  if (!classification) {
    const rows = await db
      .select()
      .from(classifications)
      .where(and(eq(classifications.sportId, sport.id), eq(classifications.slug, "ncaa-fbs")))
      .limit(1);
    classification = rows[0];
  }

  if (!classification) {
    throw new Error("Failed to seed NCAA FBS classification");
  }

  const currentYear = new Date().getFullYear();

  await db
    .insert(seasons)
    .values({
      classificationId: classification.id,
      year: currentYear,
      status: "upcoming",
    })
    .onConflictDoNothing();

  console.log(`Seeded: Football / NCAA FBS / ${currentYear} season`);
}
