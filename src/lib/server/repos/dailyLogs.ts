import { getDbPool } from "../db";
import { newUuid } from "../auth";

export type SocialActivity = "low" | "medium" | "high";

export type CreateDailyLogInput = {
  userId: string;
  logDate: string; // YYYY-MM-DD
  timezone: string;
  sleepHours: number;
  socialActivity: SocialActivity;
  screenTimeHours: number;
  moodRating?: number;
  notesEncrypted?: Buffer | null;
};

export type DbDailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  timezone: string;
  sleep_hours: string;
  social_activity: string;
  screen_time_hours: string;
  mood_rating: number | null;
  created_at: string;
  updated_at: string;
};

export async function upsertDailyLog(input: CreateDailyLogInput): Promise<DbDailyLog> {
  const pool = getDbPool();
  const id = newUuid();

  const res = await pool.query<DbDailyLog>(
    `INSERT INTO daily_logs (
        id, user_id, log_date, timezone,
        sleep_hours, social_activity, screen_time_hours, mood_rating,
        notes_encrypted
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (user_id, log_date)
      DO UPDATE SET
        timezone = EXCLUDED.timezone,
        sleep_hours = EXCLUDED.sleep_hours,
        social_activity = EXCLUDED.social_activity,
        screen_time_hours = EXCLUDED.screen_time_hours,
        mood_rating = EXCLUDED.mood_rating,
        notes_encrypted = EXCLUDED.notes_encrypted,
        updated_at = now()
      RETURNING *`,
    [
      id,
      input.userId,
      input.logDate,
      input.timezone,
      input.sleepHours,
      input.socialActivity,
      input.screenTimeHours,
      input.moodRating ?? null,
      input.notesEncrypted ?? null,
    ]
  );

  return res.rows[0]!;
}

export async function listDailyLogs(params: {
  userId: string;
  from?: string;
  to?: string;
  limit: number;
  cursor?: string; // base64 of date
}): Promise<{ items: DbDailyLog[]; nextCursor: string | null }> {
  const pool = getDbPool();

  const conditions: string[] = ["user_id = $1"]; // param 1
  const values: Array<string | number> = [params.userId];

  if (params.from) {
    values.push(params.from);
    conditions.push(`log_date >= $${values.length}`);
  }
  if (params.to) {
    values.push(params.to);
    conditions.push(`log_date <= $${values.length}`);
  }
  if (params.cursor) {
    const decoded = Buffer.from(params.cursor, "base64").toString("utf8");
    // Cursor is the last seen date; fetch older
    values.push(decoded);
    conditions.push(`log_date < $${values.length}`);
  }

  values.push(params.limit + 1);

  const res = await pool.query<DbDailyLog>(
    `SELECT *
     FROM daily_logs
     WHERE ${conditions.join(" AND ")}
     ORDER BY log_date DESC
     LIMIT $${values.length}`,
    values
  );

  const rows = res.rows;
  const hasMore = rows.length > params.limit;
  const items = hasMore ? rows.slice(0, params.limit) : rows;
  const nextCursor = hasMore
    ? Buffer.from(items[items.length - 1]!.log_date, "utf8").toString("base64")
    : null;

  return { items, nextCursor };
}
