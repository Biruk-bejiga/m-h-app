import { Pool } from "pg";
import { getServerEnv } from "./env";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;
  const env = getServerEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    // Reasonable defaults; tune per deployment.
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  return pool;
}
