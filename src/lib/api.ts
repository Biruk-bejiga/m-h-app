import type { CheckIn, RiskAssessment } from "@/lib/types";

export type CreateCheckInRequest = Omit<CheckIn, "id" | "createdAt"> & {
  moodRating?: number;
};

export async function createCheckIn(req: CreateCheckInRequest) {
  const res = await fetch("/api/checkins", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as { ok: true };
}

export async function getRiskAssessment(req: CreateCheckInRequest) {
  const res = await fetch("/api/risk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as RiskAssessment;
}
