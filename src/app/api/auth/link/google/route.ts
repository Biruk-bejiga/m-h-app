import { NextResponse } from "next/server";

import { auth } from "@/lib/server/authjs";
import { getClientIp } from "@/lib/server/auth";
import { ensureSession } from "@/lib/server/ensureSession";
import { rateLimit } from "@/lib/server/rateLimit";
import { getUserByAuth, linkUserToAuth } from "@/lib/server/repos/users";

export async function POST() {
  const ip = await getClientIp();
  const rl = await rateLimit({ key: `auth:link:google:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "retry-after": Math.ceil(rl.resetMs / 1000).toString() } }
    );
  }

  // Ensure we have an app user to link to (creates anonymous if needed)
  const appSession = await ensureSession();

  // Require a valid Auth.js session
  const oauthSession = await auth();
  if (!oauthSession) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const extra = oauthSession as unknown as Record<string, unknown>;
  const provider = typeof extra.provider === "string" ? extra.provider : undefined;
  const providerAccountId =
    typeof extra.providerAccountId === "string" ? extra.providerAccountId : undefined;
  const email =
    (typeof extra.email === "string" ? extra.email : null) ?? oauthSession.user?.email ?? null;

  if (provider !== "google" || !providerAccountId) {
    return NextResponse.json({ error: "Google OAuth session required" }, { status: 400 });
  }

  const existing = await getUserByAuth({ provider, subject: providerAccountId });
  if (existing && existing.id !== appSession.userId) {
    return NextResponse.json(
      { error: "This Google account is already linked to another user" },
      { status: 409 }
    );
  }

  await linkUserToAuth({
    userId: appSession.userId,
    provider,
    subject: providerAccountId,
    email,
  });

  return NextResponse.json({ ok: true });
}
