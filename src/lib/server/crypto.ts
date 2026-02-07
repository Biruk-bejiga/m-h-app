import crypto from "crypto";
import { getServerEnv } from "./env";

function getOptionalKey(): Buffer | null {
  const env = getServerEnv();
  if (!env.DATA_ENCRYPTION_KEY) return null;

  // Accept base64 or utf-8; base64 is preferred.
  const maybeBase64 = Buffer.from(env.DATA_ENCRYPTION_KEY, "base64");
  const key = maybeBase64.length === 32 ? maybeBase64 : Buffer.from(env.DATA_ENCRYPTION_KEY, "utf8");
  if (key.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes (or base64-encoded 32 bytes)");
  }
  return key;
}

// AES-256-GCM: output = iv(12) || tag(16) || ciphertext
export function encryptToBytes(plaintext: string): Buffer {
  const key = getOptionalKey();
  if (!key) throw new Error("DATA_ENCRYPTION_KEY is not set");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function tryEncryptToBytes(plaintext: string): Buffer | null {
  const key = getOptionalKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptFromBytes(payload: Buffer): string {
  const key = getKey();
  if (payload.length < 12 + 16) throw new Error("Invalid encrypted payload");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
