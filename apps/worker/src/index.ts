import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAbsurdApp, initAbsurdQueue, registerTasks } from "@callsheet/tasks";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Callsheet worker starting...");

  const app = getAbsurdApp();
  registerTasks(app);
  await initAbsurdQueue();

  const worker = await app.startWorker();
  console.log("Worker ready");

  const shutdown = async () => {
    console.log("Worker shutting down...");
    await worker.close();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
