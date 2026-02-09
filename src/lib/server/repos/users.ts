import { getDbPool } from "../db";
import { newUuid } from "../auth";
import { hmacEmail } from "../privacy";

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

export async function getUserByAuth(params: {
  provider: string;
  subject: string;
}): Promise<DbUser | null> {
  const pool = getDbPool();
  const res = await pool.query<DbUser>(
    `SELECT id, is_anonymous, created_at
     FROM users
     WHERE auth_provider = $1 AND auth_subject = $2 AND status = 'active'
     LIMIT 1`,
    [params.provider, params.subject]
  );
  return res.rows[0] ?? null;
}

export async function createUserFromAuth(params: {
  provider: string;
  subject: string;
  email?: string | null;
}): Promise<DbUser> {
  const pool = getDbPool();
  const id = newUuid();
  const emailHash = params.email ? hmacEmail(params.email) : null;

  const res = await pool.query<DbUser>(
    `INSERT INTO users (id, is_anonymous, auth_provider, auth_subject, email_hash)
     VALUES ($1, false, $2, $3, $4)
     RETURNING id, is_anonymous, created_at`,
    [id, params.provider, params.subject, emailHash]
  );
  return res.rows[0]!;
}

export async function linkUserToAuth(params: {
  userId: string;
  provider: string;
  subject: string;
  email?: string | null;
}): Promise<void> {
  const pool = getDbPool();
  const emailHash = params.email ? hmacEmail(params.email) : null;

  await pool.query(
    `UPDATE users
     SET is_anonymous = false,
         auth_provider = $2,
         auth_subject = $3,
         email_hash = COALESCE($4, email_hash),
         updated_at = now()
     WHERE id = $1 AND status = 'active'`,
    [params.userId, params.provider, params.subject, emailHash]
  );
}
