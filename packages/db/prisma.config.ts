import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// The monorepo keeps a single root .env, which apps/api and apps/worker load
// the same way. The Prisma CLI resolves .env relative to this package, so
// without this it never sees DATABASE_URL. A missing file is not an error:
// CI and Fly inject real environment variables, and dotenv leaves any variable
// that is already set untouched.
loadEnv({ path: resolve(__dirname, "../../.env") });

// Migrations must use the direct connection rather than the pooler (port 6543
// on Supabase). DATABASE_URL_DIRECT holds that connection when one is set.
if (process.env.DATABASE_URL_DIRECT) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
}

export default defineConfig({
  schema: resolve(__dirname, "prisma/schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
