import { Absurd } from "absurd-sdk";

export const QUEUE_NAME = "callsheet";

let app: Absurd | null = null;
let queueInitialized = false;

export function getAbsurdApp(): Absurd {
  if (!app) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    app = new Absurd({ db: dbUrl, queueName: QUEUE_NAME });
  }
  return app;
}

export async function initAbsurdQueue(): Promise<void> {
  const absurd = getAbsurdApp();
  await absurd.createQueue(QUEUE_NAME);
}

export async function ensureAbsurdQueue(): Promise<void> {
  if (!queueInitialized) {
    await initAbsurdQueue();
    queueInitialized = true;
  }
}

export async function spawnTask<T>(taskName: string, params: T): Promise<void> {
  await ensureAbsurdQueue();
  const absurd = getAbsurdApp();
  await absurd.spawn(taskName, params as Parameters<Absurd["spawn"]>[1], {
    queue: QUEUE_NAME,
  });
}
