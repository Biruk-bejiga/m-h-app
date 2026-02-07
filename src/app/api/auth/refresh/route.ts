import { NextResponse } from "next/server";

import { refreshSessionFromCookie, setSessionCookies } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/repos/users";

export async function POST() {
  const refreshed = await refreshSessionFromCookie();
  if (!refreshed) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await getUserById(refreshed.sub);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await setSessionCookies({ userId: user.id, isAnonymous: user.is_anonymous });
  return NextResponse.json({ ok: true });
}
