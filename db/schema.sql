-- PostgreSQL schema for secure mental-health API
-- Use a migration tool in production (e.g., Prisma/Drizzle migrations/Flyway).

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  is_anonymous boolean NOT NULL DEFAULT true,

  -- Optional: if you later add email/passwordless, store a hash (HMAC) rather than plaintext
  email_hash text UNIQUE,

  -- OAuth linking (optional)
  auth_provider text,
  auth_subject text,

  status text NOT NULL DEFAULT 'active'
);

-- Ensure a given OAuth account maps to a single user
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_provider_subject_ux
  ON users(auth_provider, auth_subject)
  WHERE auth_provider IS NOT NULL AND auth_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS daily_logs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  log_date date NOT NULL,
  timezone text NOT NULL,

  sleep_hours numeric(4,2) NOT NULL,
  social_activity text NOT NULL,
  screen_time_hours numeric(4,2) NOT NULL,
  mood_rating smallint,

  -- Reserved for future fields
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes_encrypted bytea,

  CONSTRAINT daily_logs_one_per_day UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx ON daily_logs(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_log_id uuid REFERENCES daily_logs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  model_name text NOT NULL,
  model_version text NOT NULL,

  risk_level text NOT NULL,
  risk_score numeric(5,4) NOT NULL,

  features_encrypted bytea,
  explanation_encrypted bytea
);

CREATE INDEX IF NOT EXISTS predictions_user_created_idx ON predictions(user_id, created_at DESC);
