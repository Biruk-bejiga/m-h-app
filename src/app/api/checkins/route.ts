import { NextResponse } from "next/server";
import { z } from "zod";

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

  // Mock: in a real app, persist to DB and associate with a user/session.
  return NextResponse.json({ ok: true });
}
