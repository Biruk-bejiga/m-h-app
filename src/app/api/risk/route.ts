import { NextResponse } from "next/server";
import { z } from "zod";

import { assessRisk } from "@/lib/risk";

const schema = z.object({
  sleepHours: z.number().min(0).max(24),
  socialActivity: z.enum(["low", "medium", "high"]),
  screenTimeHours: z.number().min(0).max(24),
  moodRating: z.number().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  return NextResponse.json(assessRisk(parsed.data));
}
