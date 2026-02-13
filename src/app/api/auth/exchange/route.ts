import { NextResponse } from "next/server";

import { auth } from "@/lib/server/authjs";
import { getClientIp, setSessionCookies } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rateLimit";
import { createUserFromAuth, getUserByAuth } from "@/lib/server/repos/users";

export async function POST() {
  const ip = await getClientIp();
  const rl = await rateLimit({ key: `auth:exchange:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "retry-after": Math.ceil(rl.resetMs / 1000).toString() } }
    );
  }

  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const extra = session as unknown as Record<string, unknown>;
  const provider = typeof extra.provider === "string" ? extra.provider : undefined;
  const providerAccountId =
    typeof extra.providerAccountId === "string" ? extra.providerAccountId : undefined;
  const email =
    (typeof extra.email === "string" ? extra.email : null) ?? session.user?.email ?? null;

  if (!provider || !providerAccountId) {
    return NextResponse.json(
      { error: "Missing OAuth subject in session" },
      { status: 400 }
    );
  }

  let user = await getUserByAuth({ provider, subject: providerAccountId });
  if (!user) {
    user = await createUserFromAuth({ provider, subject: providerAccountId, email });
  }

  await setSessionCookies({ userId: user.id, isAnonymous: user.is_anonymous });

  return NextResponse.json({ ok: true, user: { id: user.id, isAnonymous: user.is_anonymous } });
}
