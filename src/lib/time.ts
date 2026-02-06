import { format, isSameDay, parseISO, startOfDay, subDays } from "date-fns";
import type { CheckIn } from "@/lib/types";

export type ChartPoint = {
  date: string; // yyyy-MM-dd
  label: string; // e.g. Feb 6
  riskScore: number;
  moodRating?: number;
};

export function toDayKey(iso: string) {
  return format(parseISO(iso), "yyyy-MM-dd");
}

export function buildDailySeries(checkins: CheckIn[], days: number): ChartPoint[] {
  const now = new Date();
  const start = startOfDay(subDays(now, days - 1));

  const sorted = [...checkins].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
  );

  const points: ChartPoint[] = [];
  for (let i = 0; i < days; i++) {
    const day = startOfDay(subDays(now, days - 1 - i));
    const dayEntries = sorted.filter((c) => isSameDay(parseISO(c.createdAt), day));
    const latest = dayEntries.at(-1);

    points.push({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "MMM d"),
      riskScore: latest ? 0 : 0,
      moodRating: latest?.moodRating,
    });
  }

  return points;
}
