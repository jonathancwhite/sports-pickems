import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Runs via `tsx`, not the Prisma CLI, so prisma.config.ts does not apply here.
// Load the root .env before importing the client, which reads DATABASE_URL as
// it is constructed.
loadEnv({ path: resolve(__dirname, "../../../.env") });

const { seed } = await import("../src/seed.js");

await seed();
console.log("Database seed complete");
