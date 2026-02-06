import type { CheckIn, RiskAssessment, RiskLevel } from "@/lib/types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function assessRisk(input: Pick<
  CheckIn,
  "sleepHours" | "socialActivity" | "screenTimeHours" | "moodRating"
>): RiskAssessment {
  let score = 0;
  const reasons: string[] = [];

  const sleep = clamp(input.sleepHours, 0, 24);
  const screen = clamp(input.screenTimeHours, 0, 24);

  if (sleep < 6) {
    score += 2;
    reasons.push("Low sleep (<6h)");
  } else if (sleep < 7) {
    score += 1;
    reasons.push("Borderline sleep (6–7h)");
  } else if (sleep > 9) {
    score += 1;
    reasons.push("High sleep (>9h)");
  }

  if (input.socialActivity === "low") {
    score += 2;
    reasons.push("Low social activity");
  } else if (input.socialActivity === "medium") {
    score += 1;
    reasons.push("Moderate social activity");
  }

  if (screen > 8) {
    score += 2;
    reasons.push("High screen time (>8h)");
  } else if (screen >= 5) {
    score += 1;
    reasons.push("Moderate screen time (5–8h)");
  }

  if (typeof input.moodRating === "number") {
    const mood = clamp(input.moodRating, 1, 5);
    if (mood <= 2) {
      score += 2;
      reasons.push("Low mood (1–2)");
    } else if (mood === 3) {
      score += 1;
      reasons.push("Neutral mood (3)");
    }
  }

  const level: RiskLevel = score >= 6 ? "high" : score >= 3 ? "medium" : "low";
  return { score, level, reasons };
}

export function riskLabel(level: RiskLevel) {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
}

export function riskColor(level: RiskLevel) {
  switch (level) {
    case "low":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30";
    case "medium":
      return "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30";
    case "high":
      return "bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30";
  }
}
