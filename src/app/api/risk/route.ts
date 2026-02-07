import { NextResponse } from "next/server";

import { assessRisk } from "@/lib/risk";
import { checkInSchema } from "@/lib/schemas/checkin";
import { getClientIp } from "@/lib/server/auth";
import { ensureSession } from "@/lib/server/ensureSession";
import { rateLimit } from "@/lib/server/rateLimit";
import { createPrediction } from "@/lib/server/repos/predictions";
import { tryEncryptToBytes } from "@/lib/server/crypto";

export async function POST(req: Request) {
  const ip = await getClientIp();
  const rl = await rateLimit({
    key: `risk:post:${ip}`,
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

  const json = await req.json().catch(() => null);
  const parsed = checkInSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const session = await ensureSession();
  const assessment = assessRisk(parsed.data);

  const featuresEncrypted = tryEncryptToBytes(JSON.stringify({
    sleepHours: parsed.data.sleepHours,
    socialActivity: parsed.data.socialActivity,
    screenTimeHours: parsed.data.screenTimeHours,
    moodRating: parsed.data.moodRating,
  }));

  // Store prediction (best-effort). If DB/env isn't configured, surface a clean error.
  await createPrediction({
    userId: session.userId,
    dailyLogId: null,
    modelName: "heuristic-risk",
    modelVersion: "v1",
    riskLevel: assessment.level,
    riskScore: assessment.score,
    featuresEncrypted,
    explanationEncrypted: tryEncryptToBytes(JSON.stringify({ reasons: assessment.reasons })),
  });

  return NextResponse.json(assessment);
}
