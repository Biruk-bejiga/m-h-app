import { NextResponse } from "next/server";

import { setSessionCookies } from "@/lib/server/auth";
import { createAnonymousUser } from "@/lib/server/repos/users";

export async function POST() {
  const user = await createAnonymousUser();
  await setSessionCookies({ userId: user.id, isAnonymous: true });

  return NextResponse.json(
    {
      user: {
        id: user.id,
        isAnonymous: true,
        createdAt: user.created_at,
      },
      ok: true,
    },
    { status: 201 }
  );
}
