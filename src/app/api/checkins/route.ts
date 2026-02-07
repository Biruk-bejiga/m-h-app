import { NextResponse } from "next/server";

import { checkInSchema } from "@/lib/schemas/checkin";
import { getClientIp } from "@/lib/server/auth";
import { ensureSession } from "@/lib/server/ensureSession";
import { rateLimit } from "@/lib/server/rateLimit";
import { tryEncryptToBytes } from "@/lib/server/crypto";
import { listDailyLogs, upsertDailyLog } from "@/lib/server/repos/dailyLogs";

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const ip = await getClientIp();
  const rl = await rateLimit({
    key: `checkins:post:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "retry-after": Math.ceil(rl.resetMs / 1000).toString(),
        },
      }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = checkInSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const session = await ensureSession();
  const logDate = parsed.data.logDate ?? todayUtcDate();
  const timezone = parsed.data.timezone ?? "UTC";

  const notesEncrypted = parsed.data.notes
    ? tryEncryptToBytes(parsed.data.notes)
    : null;

  const saved = await upsertDailyLog({
    userId: session.userId,
    logDate,
    timezone,
    sleepHours: parsed.data.sleepHours,
    socialActivity: parsed.data.socialActivity,
    screenTimeHours: parsed.data.screenTimeHours,
    moodRating: parsed.data.moodRating,
    notesEncrypted,
  });

  return NextResponse.json({ ok: true, id: saved.id });
}

export async function GET(req: Request) {
  // Historical fetch: require an existing session (don't create a new anonymous user just to read).
  const ip = await getClientIp();
  const rl = await rateLimit({
    key: `checkins:get:${ip}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "retry-after": Math.ceil(rl.resetMs / 1000).toString() },
      }
    );
  }

  const { getSession } = await import("@/lib/server/auth");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50"), 1), 100);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const { items, nextCursor } = await listDailyLogs({
    userId: session.sub,
    from,
    to,
    limit,
    cursor,
  });

  // Do not return encrypted notes by default.
  return NextResponse.json({
    items: items.map((r) => ({
      id: r.id,
      logDate: r.log_date,
      timezone: r.timezone,
      sleepHours: Number(r.sleep_hours),
      socialActivity: r.social_activity,
      screenTimeHours: Number(r.screen_time_hours),
      moodRating: r.mood_rating ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    nextCursor,
  });
}
