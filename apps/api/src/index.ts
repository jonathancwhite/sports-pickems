import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { gamesRouter } from "./routes/games.js";
import { healthRouter } from "./routes/health.js";
import { cronRouter } from "./routes/cron.js";
import { leaguesRouter } from "./routes/leagues.js";
import { sportsRouter } from "./routes/sports.js";
import { usersRouter } from "./routes/users.js";
import { clerkWebhookRouter } from "./routes/webhooks/clerk.js";
import { requireAuthUnlessPublic } from "./middleware/clerk-auth.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.WEB_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  clerkWebhookRouter,
);

app.use(express.json());
app.use(clerkMiddleware());
app.use("/api", requireAuthUnlessPublic);

app.use("/api", healthRouter);
app.use("/api/cron", cronRouter);
app.use("/api/users", usersRouter);
app.use("/api/leagues", leaguesRouter);
app.use("/api/sports", sportsRouter);
app.use("/api/games", gamesRouter);

app.get("/", (_req, res) => {
  res.json({ name: "Callsheet API", version: "0.2.0" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

export { app };
