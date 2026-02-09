import crypto from "crypto";
import { getServerEnv } from "./env";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hmacEmail(email: string): string | null {
  const env = getServerEnv();
  if (!env.AUTH_EMAIL_PEPPER) return null;
  const normalized = normalizeEmail(email);
  return crypto
    .createHmac("sha256", env.AUTH_EMAIL_PEPPER)
    .update(normalized)
    .digest("hex");
}
