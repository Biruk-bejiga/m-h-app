import { NextResponse } from "next/server";
import { z } from "zod";

import { assessRisk } from "@/lib/risk";
import { checkInSchema } from "@/lib/schemas/checkin";
import { getClientIp, getSession } from "@/lib/server/auth";
import { ensureSession } from "@/lib/server/ensureSession";
import { rateLimit } from "@/lib/server/rateLimit";
import { createPrediction } from "@/lib/server/repos/predictions";
import { tryEncryptToBytes } from "@/lib/server/crypto";

const postSchema = z.object({
  input: checkInSchema,
});

export async function POST(req: Request) {
  const ip = await getClientIp();
  const rl = await rateLimit({ key: `predictions:post:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "retry-after": Math.ceil(rl.resetMs / 1000).toString() } }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const session = await ensureSession();
  const assessment = assessRisk(parsed.data.input);

  await createPrediction({
    userId: session.userId,
    dailyLogId: null,
    modelName: "heuristic-risk",
    modelVersion: "v1",
    riskLevel: assessment.level,
    riskScore: assessment.score,
    featuresEncrypted: tryEncryptToBytes(JSON.stringify(parsed.data.input)),
    explanationEncrypted: tryEncryptToBytes(JSON.stringify({ reasons: assessment.reasons })),
  });

  return NextResponse.json({
    prediction: {
      score: assessment.score,
      level: assessment.level,
      reasons: assessment.reasons,
    },
  });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Minimal placeholder: listing predictions can be added when needed.
  // Keeping this endpoint defined makes the API surface explicit.
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "20"), 1), 100);

  return NextResponse.json({ items: [], limit });
}
