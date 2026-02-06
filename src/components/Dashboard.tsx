"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useCheckInStore } from "@/store/checkins";
import { assessRisk } from "@/lib/risk";
import { RiskBadge } from "@/components/RiskBadge";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TrendChart } from "@/components/TrendChart";

type RangeMode = "week" | "month";

export function Dashboard() {
  const { checkins, hasHydrated } = useCheckInStore((s) => ({
    checkins: s.checkins,
    hasHydrated: s.hasHydrated,
  }));

  const [range, setRange] = useState<RangeMode>("week");

  const latest = checkins.at(-1);
  const risk = latest
    ? assessRisk({
        sleepHours: latest.sleepHours,
        socialActivity: latest.socialActivity,
        screenTimeHours: latest.screenTimeHours,
        moodRating: latest.moodRating,
      })
    : null;

  const chartData = useMemo(() => {
    const days = range === "week" ? 7 : 30;
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (days - 1));

    const points = [] as { label: string; riskScore: number }[];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

      const dayCheckins = checkins.filter((c) => {
        const cd = new Date(c.createdAt);
        return (
          cd.getFullYear() === d.getFullYear() &&
          cd.getMonth() === d.getMonth() &&
          cd.getDate() === d.getDate()
        );
      });

      const last = dayCheckins.at(-1);
      const dayRisk = last
        ? assessRisk({
            sleepHours: last.sleepHours,
            socialActivity: last.socialActivity,
            screenTimeHours: last.screenTimeHours,
            moodRating: last.moodRating,
          })
        : null;

      points.push({ label, riskScore: dayRisk?.score ?? 0 });
    }

    return points;
  }, [checkins, range]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-300">
            View your current risk level and recent trends.
          </p>
        </div>

        <SegmentedControl<RangeMode>
          label="Range"
          value={range}
          options={[
            { value: "week", label: "Weekly" },
            { value: "month", label: "Monthly" },
          ]}
          onChange={setRange}
        />
      </header>

      {!hasHydrated ? (
        <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-sm text-slate-300">Loading your data…</div>
        </div>
      ) : latest && risk ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10 lg:col-span-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Current risk</div>
                <div className="mt-1 text-xs text-slate-300">
                  Based on your latest check-in.
                </div>
              </div>
              <RiskBadge level={risk.level} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-950/30 p-3 ring-1 ring-white/10">
                <dt className="text-xs text-slate-400">Sleep</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  {latest.sleepHours}h
                </dd>
              </div>
              <div className="rounded-lg bg-slate-950/30 p-3 ring-1 ring-white/10">
                <dt className="text-xs text-slate-400">Screen</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  {latest.screenTimeHours}h
                </dd>
              </div>
              <div className="rounded-lg bg-slate-950/30 p-3 ring-1 ring-white/10">
                <dt className="text-xs text-slate-400">Social</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  {latest.socialActivity}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-950/30 p-3 ring-1 ring-white/10">
                <dt className="text-xs text-slate-400">Mood</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  {latest.moodRating ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 text-xs text-slate-300">
              {risk.reasons.length > 0 ? (
                <p>
                  <span className="font-semibold text-slate-100">Drivers:</span>{" "}
                  {risk.reasons.join(", ")}
                </p>
              ) : (
                <p>No risk factors detected in the latest entry.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <TrendChart
              title="Risk score trend"
              description={range === "week" ? "Last 7 days" : "Last 30 days"}
              data={chartData.map((p) => ({
                date: p.label,
                label: p.label,
                riskScore: p.riskScore,
              }))}
            />
          </div>
        </section>
      ) : (
        <section className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
          <h2 className="text-lg font-semibold text-white">No check-ins yet</h2>
          <p className="mt-2 text-sm text-slate-300">
            Add your first daily check-in to see risk level and trends.
          </p>
          <div className="mt-4">
            <Link
              href="/checkin"
              className="inline-flex rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
            >
              Create a check-in
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
