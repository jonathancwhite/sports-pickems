import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type DbClient = ReturnType<typeof createDb>;

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function createDb(connectionString: string) {
  const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(sql, { schema });
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!db) {
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema });
  }

  return db;
}

export async function checkDbConnection(): Promise<boolean> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return false;
  }

  const sql = postgres(connectionString, { max: 1, connect_timeout: 5 });
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = null;
    db = null;
  }
}
