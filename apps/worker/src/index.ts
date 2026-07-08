import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

/**
 * Absurd SDK worker stub — task registration added in Sprint 10.
 * @see https://github.com/earendil-works/absurd
 */
async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Callsheet worker starting...");
  console.log("Absurd task registration will be added in Sprint 10.");
  console.log("Worker ready (stub mode).");

  // Keep process alive in dev
  process.on("SIGINT", () => {
    console.log("Worker shutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
