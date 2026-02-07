import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { getServerEnv } from "./env";

const ACCESS_COOKIE = "mh_access";
const REFRESH_COOKIE = "mh_refresh";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

function getJwtSecret(): Uint8Array {
  const env = getServerEnv();
  // Prefer base64 secret; fall back to utf-8.
  const maybeBase64 = Buffer.from(env.AUTH_JWT_SECRET, "base64");
  const secret = maybeBase64.length >= 32 ? maybeBase64 : Buffer.from(env.AUTH_JWT_SECRET, "utf8");
  if (secret.length < 32) throw new Error("AUTH_JWT_SECRET must be at least 32 bytes");
  return new Uint8Array(secret);
}

export type SessionClaims = {
  sub: string; // user id
  isAnonymous: boolean;
};

async function signToken(claims: SessionClaims, ttlSeconds: number): Promise<string> {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ isAnonymous: claims.isAnonymous })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secret);
}

async function verifyToken(token: string): Promise<SessionClaims> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  if (!payload.sub) throw new Error("Missing sub");
  const extra = payload as Record<string, unknown>;
  return {
    sub: payload.sub,
    isAnonymous: extra.isAnonymous === true,
  };
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // If behind a proxy/CDN, configure your platform to set this header reliably.
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || "unknown";
}

export function newUuid(): string {
  return crypto.randomUUID();
}

export async function getSession(): Promise<SessionClaims | null> {
  const c = await cookies();
  const access = c.get(ACCESS_COOKIE)?.value;
  if (!access) return null;
  try {
    return await verifyToken(access);
  } catch {
    return null;
  }
}

export async function setSessionCookies(params: { userId: string; isAnonymous: boolean }) {
  const c = await cookies();

  const access = await signToken(
    { sub: params.userId, isAnonymous: params.isAnonymous },
    ACCESS_TTL_SECONDS
  );
  const refresh = await signToken(
    { sub: params.userId, isAnonymous: params.isAnonymous },
    REFRESH_TTL_SECONDS
  );

  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  c.set(ACCESS_COOKIE, access, { ...common, maxAge: ACCESS_TTL_SECONDS });
  c.set(REFRESH_COOKIE, refresh, { ...common, maxAge: REFRESH_TTL_SECONDS });
}

export async function clearSessionCookies() {
  const c = await cookies();
  c.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  c.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function refreshSessionFromCookie(): Promise<SessionClaims | null> {
  const c = await cookies();
  const refresh = c.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  try {
    return await verifyToken(refresh);
  } catch {
    return null;
  }
}

export const SessionCookies = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
};
