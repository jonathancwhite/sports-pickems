import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import cors from "cors";
import express from "express";
import { checkDbConnection } from "@callsheet/db";
import { healthRouter } from "./routes/health.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api", healthRouter);

app.get("/", (_req, res) => {
  res.json({ name: "Callsheet API", version: "0.2.0" });
});

app.listen(port, async () => {
  const dbOk = await checkDbConnection();
  console.log(
    `API running on http://localhost:${port} (db: ${dbOk ? "connected" : "disconnected"})`,
  );
});

export { app };
