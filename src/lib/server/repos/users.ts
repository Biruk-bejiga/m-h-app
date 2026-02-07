import { getDbPool } from "../db";
import { newUuid } from "../auth";

export type DbUser = {
  id: string;
  is_anonymous: boolean;
  created_at: string;
};

export async function createAnonymousUser(): Promise<DbUser> {
  const pool = getDbPool();
  const id = newUuid();
  const res = await pool.query<DbUser>(
    `INSERT INTO users (id, is_anonymous)
     VALUES ($1, true)
     RETURNING id, is_anonymous, created_at`,
    [id]
  );
  return res.rows[0]!;
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  const pool = getDbPool();
  const res = await pool.query<DbUser>(
    `SELECT id, is_anonymous, created_at
     FROM users
     WHERE id = $1 AND status = 'active'`,
    [userId]
  );
  return res.rows[0] ?? null;
}
