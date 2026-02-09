import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_JWT_SECRET: z.string().min(32),
  DATA_ENCRYPTION_KEY: z.string().min(32).optional(),

  // Auth.js / NextAuth
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),

  // Optional: used to HMAC email before storing (avoid plaintext)
  AUTH_EMAIL_PEPPER: z.string().min(16).optional(),

  // Optional Upstash Redis (recommended for production rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Intentionally throw a concise error; don't leak env values.
    throw new Error(
      `Invalid server env: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`
    );
  }
  cached = parsed.data;
  return cached;
}
